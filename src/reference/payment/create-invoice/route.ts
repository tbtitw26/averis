import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/auth'
import { dbConnect } from '@/lib/mongodb'
import { OrderModel } from '@/lib/models'
import { createPaymentInvoice, cardHppService } from '@/lib/spoynt'
import { randomUUID } from 'crypto'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const VALID_CURRENCIES = ['GBP', 'EUR' /*, 'AUD', 'CAD', 'NZD', 'NOK'*/]

export async function POST(request: NextRequest) {
  try {
    console.log('[payment:create-invoice] request received')

    const user = await getServerUser()
    if (!user) {
      console.warn('[payment:create-invoice] WARN unauthorized request')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.log(`[payment:create-invoice] user authenticated user_id=${user.userId} email=${user.email}`)

    const body = await request.json()
    const { tokens, plan, currency, totalPrice } = body

    if (!tokens || !Number.isFinite(tokens) || tokens <= 0) {
      return NextResponse.json({ error: 'Invalid token amount' }, { status: 400 })
    }
    if (!currency || !VALID_CURRENCIES.includes(currency)) {
      return NextResponse.json({ error: 'Invalid currency' }, { status: 400 })
    }
    if (!totalPrice || !Number.isFinite(totalPrice) || totalPrice <= 0) {
      return NextResponse.json({ error: 'Invalid price' }, { status: 400 })
    }
    const amount = Math.round(totalPrice * 100) / 100
    const tokenCount = Math.floor(tokens)

    console.log(`[payment:create-invoice] request parsed tokens=${tokenCount} plan=${plan} amount=${amount} currency=${currency}`)

    const reference = `order_${randomUUID()}`
    console.log(`[payment:create-invoice] reference generated reference=${reference}`)

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ifileconverter.co.uk'
    console.log(`[payment:create-invoice] app_url=${appUrl}`)

    await dbConnect()

    // Create an order record in MongoDB (pending state)
    await OrderModel.create({
      _id: reference,
      userId: user.userId,
      tokens: tokenCount,
      plan: plan || 'custom',
      currency: currency.toUpperCase(),
      amount,
      status: 'pending',
    })
    console.log(`[payment:create-invoice] order created in db reference=${reference}`)

    // Create Spoynt Payment Invoice (HPP redirect flow)
    const testMode = process.env.NODE_ENV !== 'production'
    const service = cardHppService(currency)
    console.log(`[payment:create-invoice] calling spoynt api test_mode=${testMode} service=${service}`)

    const invoice = await createPaymentInvoice({
      referenceId: reference,
      amount,
      currency: currency.toUpperCase(),
      service,
      description: `${tokenCount} conversion tokens – ${plan || 'custom'} plan`,
      callbackUrl: `${appUrl}/api/payment/callback`,
      returnUrl: `${appUrl}/pricing?reference=${encodeURIComponent(reference)}`,
      returnUrls: {
        success: `${appUrl}/pricing?status=success&reference=${encodeURIComponent(reference)}`,
        pending: `${appUrl}/pricing?status=pending&reference=${encodeURIComponent(reference)}`,
        fail: `${appUrl}/pricing?status=fail&reference=${encodeURIComponent(reference)}`,
      },
      customer: {
        referenceId: user.userId,
        email: user.email,
      },
      metadata: {
        user_id: user.userId,
        tokens: String(tokenCount),
        plan: plan || 'custom',
        order_id: reference,
      },
      testMode,
    })

    // Redirect URL — prefer hpp_url, fallback to flow_data action
    const redirectUrl = invoice.hppUrl || invoice.flowAction

    console.log(`[payment:create-invoice] spoynt response spoynt_id=${invoice.id} status=${invoice.status} hpp_url=${redirectUrl ?? 'none'}`)

    if (!redirectUrl) {
      console.error(`[payment:create-invoice] ERROR no redirect url from spoynt reference=${reference}`)
      return NextResponse.json({ error: 'Payment provider returned no redirect URL' }, { status: 502 })
    }

    // Store the Spoynt invoice ID so the status endpoint can query it as a fallback
    await OrderModel.findByIdAndUpdate(reference, { spoyntId: invoice.id })
    console.log(`[payment:create-invoice] order updated with spoynt_id=${invoice.id}`)

    console.log(`[payment:create-invoice] session created reference=${reference} spoynt_id=${invoice.id}`)

    return NextResponse.json({ redirectUrl, reference })
  } catch (error: any) {
    console.error(`[payment:create-invoice] ERROR ${error?.message ?? error}`)
    return NextResponse.json(
      { error: error?.message ?? 'Failed to create payment session' },
      { status: 500 }
    )
  }
}
