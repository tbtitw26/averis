import { NextRequest, NextResponse } from 'next/server'
import { verifyCallbackSignature } from '@/lib/spoynt'
import { dbConnect } from '@/lib/mongodb'
import { OrderModel, TransactionModel, TokenModel } from '@/lib/models'
import { sendPurchaseConfirmationEmail } from '@/lib/email'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

/**
 * Spoynt callback endpoint.
 * Receives POST with JSON:API body and X-Signature header.
 *
 * IMPORTANT: We do NOT rely on attrs.metadata from Spoynt — it may arrive as
 * an empty array. Instead we look up the order in MongoDB using attrs.reference_id
 * (which equals the order _id we created before the Spoynt call).
 */
export async function POST(request: NextRequest) {
  let rawBody = ''
  try {
    console.log(`[payment:callback] webhook received at ${new Date().toISOString()}`)

    rawBody = await request.text()
    const signature = request.headers.get('x-signature') || ''

    console.log(`[payment:callback] body_length=${rawBody.length} signature_present=${signature ? 'true' : 'false'}`)

    // Parse callback data
    let payload: any
    try {
      payload = JSON.parse(rawBody)
    } catch {
      console.error('[payment:callback] ERROR invalid JSON body')
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const invoiceData = payload.data
    if (!invoiceData || invoiceData.type !== 'payment-invoices') {
      console.warn(`[payment:callback] WARN invalid callback structure, unexpected type: ${invoiceData?.type}`)
      return NextResponse.json({ received: true })
    }

    const attrs = invoiceData.attributes
    const status: string = attrs.status
    const referenceId: string = attrs.reference_id
    const spoyntInvoiceId: string = invoiceData.id
    const amount = attrs.amount
    const currency = attrs.currency
    const resolution = attrs.resolution
    const isTestMode = attrs.test_mode === true

    console.log(`[payment:callback] invoice_id=${spoyntInvoiceId} reference_id=${referenceId} status=${status} resolution=${resolution} amount=${amount} currency=${currency} test_mode=${isTestMode}`)

    // Verify callback signature
    console.log('[payment:callback] verifying signature')
    const isValid = verifyCallbackSignature(rawBody, signature)
    if (!isValid) {
      console.error('[payment:callback] ERROR invalid signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }
    console.log('[payment:callback] signature verified')

    console.log(`[payment:callback] processing invoice_id=${spoyntInvoiceId} status=${status} resolution=${resolution}`)

    await dbConnect()

    // Handle failed/expired/process_failed
    if (status === 'failed' || status === 'expired' || status === 'process_failed') {
      await OrderModel.findByIdAndUpdate(referenceId, { status: 'failed' })
      console.log(`[payment:callback] payment failed reference=${referenceId} resolution=${resolution}`)
      return NextResponse.json({ received: true, status })
    }

    // Only credit tokens when fully processed
    if (status !== 'processed') {
      console.log(`[payment:callback] payment pending reference=${referenceId} status=${status}`)
      return NextResponse.json({ received: true, status })
    }

    // Look up order in MongoDB — source of truth for userId / tokens
    const order = await OrderModel.findById(referenceId)
    if (!order) {
      console.error(`[payment:callback] ERROR order not found reference=${referenceId}`)
      return NextResponse.json({ received: true, warning: 'order_not_found' })
    }

    // Idempotency: skip if already processed
    if (order.status === 'completed' || order.status === 'failed') {
      console.log(`[payment:callback] idempotency: order already processed reference=${referenceId} status=${order.status}`)
      return NextResponse.json({ received: true, message: 'Already processed' })
    }

    const { userId, tokens } = order

    // Mark order as completed
    order.status = 'completed'
    order.paymentId = spoyntInvoiceId
    order.completedAt = new Date()
    await order.save()
    console.log(`[payment:callback] order marked completed reference=${referenceId}`)

    // Record ledger transaction
    await TransactionModel.create({
      userId,
      delta: tokens,
      reason: 'purchase',
      metadata: {
        plan: order.plan || 'custom',
        order_id: referenceId,
        payment_id: spoyntInvoiceId,
        amount: amount ?? order.amount,
        currency: currency ?? order.currency,
      },
    })
    console.log(`[payment:callback] transaction recorded user_id=${userId} delta=+${tokens}`)

    // Credit token balance (upsert so first purchase creates the record)
    const updated = await TokenModel.findOneAndUpdate(
      { userId },
      { $inc: { balance: tokens } },
      { upsert: true, new: true }
    )
    console.log(`[payment:callback] tokens credited user_id=${userId} added=${tokens} new_balance=${updated?.balance}`)

    // Send purchase confirmation email (non-blocking)
    const userDoc = await (await import('@/lib/models')).UserModel.findById(userId).lean()
    if (userDoc?.email) {
      sendPurchaseConfirmationEmail({
        to: userDoc.email,
        firstName: userDoc.firstName || 'there',
        tokens,
        plan: order.plan || 'Custom',
        amount: amount ?? order.amount,
        currency: currency ?? order.currency,
        orderId: referenceId,
        paymentId: spoyntInvoiceId,
        completedAt: order.completedAt ?? new Date(),
      }).catch(() => {})
    }

    return NextResponse.json({ received: true, tokens_added: tokens })
  } catch (error: any) {
    console.error(`[payment:callback] ERROR processing callback: ${error?.message ?? error}`)
    return NextResponse.json({ error: 'Callback processing failed' }, { status: 500 })
  }
}
