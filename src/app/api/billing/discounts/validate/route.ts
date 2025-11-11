// API Route: /api/billing/discounts/validate
// Validates discount codes

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { discountManager } from '@/lib/billing/discount-manager';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { code, tierId } = body;

    if (!code) {
      return NextResponse.json(
        { error: 'Discount code is required' },
        { status: 400 }
      );
    }

    // Validate discount code
    const validation = await discountManager.validateDiscountCode(
      code,
      user.id,
      tierId
    );

    return NextResponse.json({
      success: true,
      data: validation,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
