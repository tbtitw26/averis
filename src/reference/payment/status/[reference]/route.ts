import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/auth'
import { dbConnect } from '@/lib/mongodb'
import { OrderModel, TransactionModel, TokenModel, UserModel } from '@/lib/models'
import { getPaymentInvoiceStatus } from '@/lib/spoynt'
import { sendPurchaseConfirmationEmail } from '@/lib/email'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

export async function GET(
  request: NextRequest,
  { params }: { params: { reference: string } }
) {
  try {
    const user = await getServerUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { reference } = params
    if (!reference) {
      return NextResponse.json({ error: 'Missing reference' }, { status: 400 })
    }

    await dbConnect()
    const order = await OrderModel.findById(reference)

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Security: user can only see their own orders
    if (order.userId !== user.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    console.log(`[payment:status] user_id=${user.userId} reference=${reference} status=${order.status} spoynt_id=${order.spoyntId ?? 'none'}`)

    // Fallback: if order is still pending and we have a Spoynt invoice ID,
    // query Spoynt directly in case the webhook callback never arrived.
    if (order.status === 'pending' && order.spoyntId) {
      console.log(`[payment:status] order pending — querying spoynt directly spoynt_id=${order.spoyntId}`)
      const spoyntInvoice = await getPaymentInvoiceStatus(order.spoyntId)

      if (spoyntInvoice) {
        console.log(`[payment:status] spoynt invoice_id=${spoyntInvoice.id} status=${spoyntInvoice.status} resolution=${spoyntInvoice.resolution}`)

        if (spoyntInvoice.status === 'processed') {
          // Atomically claim processing — prevents double-crediting if callback
          // and this endpoint fire simultaneously.
          const claimed = await OrderModel.findOneAndUpdate(
            { _id: reference, status: 'pending' },
            { status: 'completed', paymentId: spoyntInvoice.id, completedAt: new Date() },
            { new: false }
          )

          if (claimed) {
            // We won the race — credit tokens
            const { userId, tokens } = claimed

            await TransactionModel.create({
              userId,
              delta: tokens,
              reason: 'purchase',
              metadata: {
                plan: claimed.plan || 'custom',
                order_id: reference,
                payment_id: spoyntInvoice.id,
                amount: claimed.amount,
                currency: claimed.currency,
                source: 'status_fallback',
              },
            })

            const updated = await TokenModel.findOneAndUpdate(
              { userId },
              { $inc: { balance: tokens } },
              { upsert: true, new: true }
            )

            console.log(`[payment:status] fallback: tokens credited user_id=${userId} added=${tokens} new_balance=${updated?.balance}`)

            // Send purchase confirmation email (non-blocking)
            const userDoc = await UserModel.findById(userId).lean()
            if (userDoc?.email) {
              sendPurchaseConfirmationEmail({
                to: userDoc.email,
                firstName: userDoc.firstName || 'there',
                tokens,
                plan: claimed.plan || 'Custom',
                amount: claimed.amount,
                currency: claimed.currency,
                orderId: reference,
                paymentId: spoyntInvoice.id,
                completedAt: new Date(),
              }).catch(() => {})
            }

            return NextResponse.json({
              reference,
              status: 'completed',
              tokens,
              plan: claimed.plan,
              amount: claimed.amount,
              currency: claimed.currency,
              paymentId: spoyntInvoice.id,
              completedAt: new Date(),
              createdAt: claimed.createdAt,
            })
          }

          // If claimed is null, another process already completed it — re-fetch
          const fresh = await OrderModel.findById(reference).lean()
          console.log(`[payment:status] already completed by concurrent process reference=${reference}`)
          return NextResponse.json({
            reference: fresh!._id,
            status: fresh!.status,
            tokens: fresh!.tokens,
            plan: fresh!.plan,
            amount: fresh!.amount,
            currency: fresh!.currency,
            paymentId: fresh!.paymentId,
            completedAt: fresh!.completedAt,
            createdAt: fresh!.createdAt,
          })
        }

        if (spoyntInvoice.status === 'failed' || spoyntInvoice.status === 'expired') {
          await OrderModel.findByIdAndUpdate(reference, { status: 'failed' })
          console.log(`[payment:status] spoynt invoice failed/expired — marking order failed reference=${reference}`)
          return NextResponse.json({
            reference,
            status: 'failed',
            tokens: order.tokens,
            plan: order.plan,
            amount: order.amount,
            currency: order.currency,
            paymentId: null,
            completedAt: null,
            createdAt: order.createdAt,
          })
        }
      }
    }

    return NextResponse.json({
      reference: order._id,
      status: order.status,
      tokens: order.tokens,
      plan: order.plan,
      amount: order.amount,
      currency: order.currency,
      paymentId: order.paymentId,
      completedAt: order.completedAt,
      createdAt: order.createdAt,
    })
  } catch (error: any) {
    console.error(`[payment:status] ERROR ${error?.message ?? error}`)
    return NextResponse.json({ error: 'Failed to get order status' }, { status: 500 })
  }
}
