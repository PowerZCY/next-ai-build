## Stripe webhook事件的含义和真实场景流程：

  事件含义

  1. checkout.session.completed - 结账会话完成（一次性支付或订阅首次支付成功）
  2. invoice.paid - 发票支付成功（主要用于订阅续费）
  3. invoice.payment_failed - 发票支付失败（订阅续费失败）
  4. customer.subscription.created - 订阅创建
  5. customer.subscription.updated - 订阅更新（状态、价格等变化）
  6. customer.subscription.deleted - 订阅取消/删除
  7. charge.refunded - 费用退款

  真实场景流程组合

  1. 一次性购买流程

  checkout.session.completed
  ↓ (如果用户申请退款)
  charge.refunded

  2. 订阅创建流程

  checkout.session.completed (首次支付)
  → customer.subscription.created

  3. 订阅续费成功流程

  invoice.paid (自动续费成功)
  → customer.subscription.updated (可能更新期间等信息)

  4. 订阅续费失败流程

  invoice.payment_failed (续费失败)
  → customer.subscription.updated (状态变为past_due)
  ↓ (多次重试失败后)
  customer.subscription.deleted (订阅被取消)

  5. 用户主动取消订阅

  customer.subscription.updated (状态变为canceling)
  → customer.subscription.deleted (在当前计费周期结束时)

  6. 订阅升级/降级流程

  customer.subscription.updated (价格变更)
  → invoice.paid (如果需要立即支付差额)

  7. 订阅退款流程

  charge.refunded (退款)
  → customer.subscription.deleted (取消订阅)

  常见组合场景

  最典型的订阅全生命周期：
  1. checkout.session.completed → customer.subscription.created (用户首次订阅)
  2. invoice.paid → customer.subscription.updated (月度续费)
  3. customer.subscription.updated → customer.subscription.deleted (用户取消)

  这种设计确保了从支付到订阅管理的完整流程覆盖。


## checkout.session.completed

```json
{
  "id": "evt_1RxHxtGaouLfVOpULBZ13qu3",
  "object": "event",
  "api_version": "2025-07-30.basil",
  "created": 1755480865,
  "data": {
    "object": {
      "id": "cs_test_a1Xsxf4nY21vBzIPJWXDIg4MjcztRPIzdQva2PXUN9L11KcCZF0pf1exsf",
      "object": "checkout.session",
      "adaptive_pricing": {
        "enabled": false
      },
      "after_expiration": null,
      "allow_promotion_codes": null,
      "amount_subtotal": 19200,
      "amount_total": 19200,
      "automatic_tax": {
        "enabled": false,
        "liability": null,
        "provider": null,
        "status": null
      },
      "billing_address_collection": null,
      "cancel_url": "http://localhost:3000",
      "client_reference_id": "e4c56c8c-7bab-4ad1-a210-df683817bbdf",
      "client_secret": null,
      "collected_information": {
        "shipping_details": null
      },
      "consent": null,
      "consent_collection": null,
      "created": 1755480704,
      "currency": "usd",
      "currency_conversion": null,
      "custom_fields": [],
      "custom_text": {
        "after_submit": null,
        "shipping_address": null,
        "submit": null,
        "terms_of_service_acceptance": null
      },
      "customer": "cus_SsllV761J0q08n",
      "customer_creation": null,
      "customer_details": {
        "address": {
          "city": null,
          "country": "HK",
          "line1": null,
          "line2": null,
          "postal_code": null,
          "state": null
        },
        "email": "xyb5to0zcy@gmail.com",
        "name": "xyb5to0zcy",
        "phone": null,
        "tax_exempt": "none",
        "tax_ids": []
      },
      "customer_email": null,
      "discounts": [],
      "expires_at": 1755567104,
      "invoice": "in_1RxHxSGaouLfVOpUyWFwGR1y",
      "invoice_creation": null,
      "livemode": false,
      "locale": null,
      "metadata": {
        "user_id": "e4c56c8c-7bab-4ad1-a210-df683817bbdf",
        "order_id": "order_1755480703892_wp2738k89d",
        "credits_granted": "3000",
        "price_name": "ultra yearly"
      },
      "mode": "subscription",
      "origin_context": null,
      "payment_intent": null,
      "payment_link": null,
      "payment_method_collection": "always",
      "payment_method_configuration_details": null,
      "payment_method_options": {
        "card": {
          "request_three_d_secure": "automatic"
        }
      },
      "payment_method_types": [
        "card"
      ],
      "payment_status": "paid",
      "permissions": null,
      "phone_number_collection": {
        "enabled": false
      },
      "recovered_from": null,
      "saved_payment_method_options": {
        "allow_redisplay_filters": [
          "always"
        ],
        "payment_method_remove": "disabled",
        "payment_method_save": null
      },
      "setup_intent": null,
      "shipping_address_collection": null,
      "shipping_cost": null,
      "shipping_options": [],
      "status": "complete",
      "submit_type": null,
      "subscription": "sub_1RxHxrGaouLfVOpUpfTWqbjM",
      "success_url": "http://localhost:3000",
      "total_details": {
        "amount_discount": 0,
        "amount_shipping": 0,
        "amount_tax": 0
      },
      "ui_mode": "hosted",
      "url": null,
      "wallet_options": null
    }
  },
  "livemode": false,
  "pending_webhooks": 1,
  "request": {
    "id": null,
    "idempotency_key": null
  },
  "type": "checkout.session.completed"
}

```

## invoice.paid

```json
{
  "id": "evt_1RxHxuGaouLfVOpUB8u0OmV4",
  "object": "event",
  "api_version": "2025-07-30.basil",
  "created": 1755480864,
  "data": {
    "object": {
      "id": "in_1RxHxSGaouLfVOpUyWFwGR1y",
      "object": "invoice",
      "account_country": "HK",
      "account_name": "template 沙盒",
      "account_tax_ids": null,
      "amount_due": 19200,
      "amount_overpaid": 0,
      "amount_paid": 19200,
      "amount_remaining": 0,
      "amount_shipping": 0,
      "application": null,
      "attempt_count": 0,
      "attempted": true,
      "auto_advance": false,
      "automatic_tax": {
        "disabled_reason": null,
        "enabled": false,
        "liability": null,
        "provider": null,
        "status": null
      },
      "automatically_finalizes_at": null,
      "billing_reason": "subscription_create",
      "collection_method": "charge_automatically",
      "created": 1755480838,
      "currency": "usd",
      "custom_fields": null,
      "customer": "cus_SsllV761J0q08n",
      "customer_address": null,
      "customer_email": "xyb5to0zcy@gmail.com",
      "customer_name": "xyb5to0zcy",
      "customer_phone": null,
      "customer_shipping": null,
      "customer_tax_exempt": "none",
      "customer_tax_ids": [],
      "default_payment_method": null,
      "default_source": null,
      "default_tax_rates": [],
      "description": null,
      "discounts": [],
      "due_date": null,
      "effective_at": 1755480863,
      "ending_balance": 0,
      "footer": null,
      "from_invoice": null,
      "hosted_invoice_url": "https://invoice.stripe.com/i/acct_1RgxJCGaouLfVOpU/test_YWNjdF8xUmd4SkNHYW91TGZWT3BVLF9TdDQ2VjJiRkJtTXNtRzZUSEN4THhVTndJSmNwWGxCLDE0NjAyMTY2Ng02003G4Nipqh?s=ap",
      "invoice_pdf": "https://pay.stripe.com/invoice/acct_1RgxJCGaouLfVOpU/test_YWNjdF8xUmd4SkNHYW91TGZWT3BVLF9TdDQ2VjJiRkJtTXNtRzZUSEN4THhVTndJSmNwWGxCLDE0NjAyMTY2Ng02003G4Nipqh/pdf?s=ap",
      "issuer": {
        "type": "self"
      },
      "last_finalization_error": null,
      "latest_revision": null,
      "lines": {
        "object": "list",
        "data": [
          {
            "id": "il_1RxHxSGaouLfVOpUqLU5Y6pY",
            "object": "line_item",
            "amount": 19200,
            "currency": "usd",
            "description": "1 × Ultimate (at $192.00 / year)",
            "discount_amounts": [],
            "discountable": true,
            "discounts": [],
            "invoice": "in_1RxHxSGaouLfVOpUyWFwGR1y",
            "livemode": false,
            "metadata": {},
            "parent": {
              "invoice_item_details": null,
              "subscription_item_details": {
                "invoice_item": null,
                "proration": false,
                "proration_details": {
                  "credited_items": null
                },
                "subscription": "sub_1RxHxrGaouLfVOpUpfTWqbjM",
                "subscription_item": "si_St46RUIYZvAsFA"
              },
              "type": "subscription_item_details"
            },
            "period": {
              "end": 1787016838,
              "start": 1755480838
            },
            "pretax_credit_amounts": [],
            "pricing": {
              "price_details": {
                "price": "price_1RwJxfGaouLfVOpUplM98Xcr",
                "product": "prod_Ss45LY8HsRvKY5"
              },
              "type": "price_details",
              "unit_amount_decimal": "19200"
            },
            "quantity": 1,
            "taxes": []
          }
        ],
        "has_more": false,
        "total_count": 1,
        "url": "/v1/invoices/in_1RxHxSGaouLfVOpUyWFwGR1y/lines"
      },
      "livemode": false,
      "metadata": {},
      "next_payment_attempt": null,
      "number": "Q4L5NTYD-0003",
      "on_behalf_of": null,
      "parent": {
        "quote_details": null,
        "subscription_details": {
          "metadata": {},
          "subscription": "sub_1RxHxrGaouLfVOpUpfTWqbjM"
        },
        "type": "subscription_details"
      },
      "payment_settings": {
        "default_mandate": null,
        "payment_method_options": {
          "acss_debit": null,
          "bancontact": null,
          "card": {
            "request_three_d_secure": "automatic"
          },
          "customer_balance": null,
          "konbini": null,
          "sepa_debit": null,
          "us_bank_account": null
        },
        "payment_method_types": [
          "card"
        ]
      },
      "period_end": 1755480838,
      "period_start": 1755480838,
      "post_payment_credit_notes_amount": 0,
      "pre_payment_credit_notes_amount": 0,
      "receipt_number": null,
      "rendering": null,
      "shipping_cost": null,
      "shipping_details": null,
      "starting_balance": 0,
      "statement_descriptor": null,
      "status": "paid",
      "status_transitions": {
        "finalized_at": 1755480863,
        "marked_uncollectible_at": null,
        "paid_at": 1755480861,
        "voided_at": null
      },
      "subtotal": 19200,
      "subtotal_excluding_tax": 19200,
      "test_clock": null,
      "total": 19200,
      "total_discount_amounts": [],
      "total_excluding_tax": 19200,
      "total_pretax_credit_amounts": [],
      "total_taxes": [],
      "webhooks_delivered_at": 1755480838
    }
  },
  "livemode": false,
  "pending_webhooks": 1,
  "request": {
    "id": null,
    "idempotency_key": null
  },
  "type": "invoice.paid"
}
```

## customer.subscription.created

```json
{
  "id": "evt_1RxHnsGaouLfVOpUHA4S7Wbe",
  "object": "event",
  "api_version": "2025-07-30.basil",
  "created": 1755480244,
  "data": {
    "object": {
      "id": "sub_1RxHnrGaouLfVOpUyx8QsO59",
      "object": "subscription",
      "application": null,
      "application_fee_percent": null,
      "automatic_tax": {
        "disabled_reason": null,
        "enabled": false,
        "liability": null
      },
      "billing_cycle_anchor": 1755480241,
      "billing_cycle_anchor_config": null,
      "billing_mode": {
        "type": "classic"
      },
      "billing_thresholds": null,
      "cancel_at": null,
      "cancel_at_period_end": false,
      "canceled_at": null,
      "cancellation_details": {
        "comment": null,
        "feedback": null,
        "reason": null
      },
      "collection_method": "charge_automatically",
      "created": 1755480241,
      "currency": "usd",
      "customer": "cus_SsllV761J0q08n",
      "days_until_due": null,
      "default_payment_method": "pm_1RxHnoGaouLfVOpUkiByLaGA",
      "default_source": null,
      "default_tax_rates": [],
      "description": null,
      "discounts": [],
      "ended_at": null,
      "invoice_settings": {
        "account_tax_ids": null,
        "issuer": {
          "type": "self"
        }
      },
      "items": {
        "object": "list",
        "data": [
          {
            "id": "si_St3vPq6vmip2W9",
            "object": "subscription_item",
            "billing_thresholds": null,
            "created": 1755480242,
            "current_period_end": 1787016241,
            "current_period_start": 1755480241,
            "discounts": [],
            "metadata": {},
            "plan": {
              "id": "price_1RwJwGGaouLfVOpUOqvZtir1",
              "object": "plan",
              "active": true,
              "amount": 9600,
              "amount_decimal": "9600",
              "billing_scheme": "per_unit",
              "created": 1755250124,
              "currency": "usd",
              "interval": "year",
              "interval_count": 1,
              "livemode": false,
              "metadata": {},
              "meter": null,
              "nickname": null,
              "product": "prod_Ss44jwzw6oKCXk",
              "tiers_mode": null,
              "transform_usage": null,
              "trial_period_days": null,
              "usage_type": "licensed"
            },
            "price": {
              "id": "price_1RwJwGGaouLfVOpUOqvZtir1",
              "object": "price",
              "active": true,
              "billing_scheme": "per_unit",
              "created": 1755250124,
              "currency": "usd",
              "custom_unit_amount": null,
              "livemode": false,
              "lookup_key": "Premium_yearly",
              "metadata": {},
              "nickname": null,
              "product": "prod_Ss44jwzw6oKCXk",
              "recurring": {
                "interval": "year",
                "interval_count": 1,
                "meter": null,
                "trial_period_days": null,
                "usage_type": "licensed"
              },
              "tax_behavior": "inclusive",
              "tiers_mode": null,
              "transform_quantity": null,
              "type": "recurring",
              "unit_amount": 9600,
              "unit_amount_decimal": "9600"
            },
            "quantity": 1,
            "subscription": "sub_1RxHnrGaouLfVOpUyx8QsO59",
            "tax_rates": []
          }
        ],
        "has_more": false,
        "total_count": 1,
        "url": "/v1/subscription_items?subscription=sub_1RxHnrGaouLfVOpUyx8QsO59"
      },
      "latest_invoice": "in_1RxHnpGaouLfVOpU2bq978ef",
      "livemode": false,
      "metadata": {},
      "next_pending_invoice_item_invoice": null,
      "on_behalf_of": null,
      "pause_collection": null,
      "payment_settings": {
        "payment_method_options": {
          "acss_debit": null,
          "bancontact": null,
          "card": {
            "network": null,
            "request_three_d_secure": "automatic"
          },
          "customer_balance": null,
          "konbini": null,
          "sepa_debit": null,
          "us_bank_account": null
        },
        "payment_method_types": [
          "card"
        ],
        "save_default_payment_method": "off"
      },
      "pending_invoice_item_interval": null,
      "pending_setup_intent": null,
      "pending_update": null,
      "plan": {
        "id": "price_1RwJwGGaouLfVOpUOqvZtir1",
        "object": "plan",
        "active": true,
        "amount": 9600,
        "amount_decimal": "9600",
        "billing_scheme": "per_unit",
        "created": 1755250124,
        "currency": "usd",
        "interval": "year",
        "interval_count": 1,
        "livemode": false,
        "metadata": {},
        "meter": null,
        "nickname": null,
        "product": "prod_Ss44jwzw6oKCXk",
        "tiers_mode": null,
        "transform_usage": null,
        "trial_period_days": null,
        "usage_type": "licensed"
      },
      "quantity": 1,
      "schedule": null,
      "start_date": 1755480241,
      "status": "active",
      "test_clock": null,
      "transfer_data": null,
      "trial_end": null,
      "trial_settings": {
        "end_behavior": {
          "missing_payment_method": "create_invoice"
        }
      },
      "trial_start": null
    }
  },
  "livemode": false,
  "pending_webhooks": 1,
  "request": {
    "id": null,
    "idempotency_key": "d9b775c7-a65f-4c1a-8b35-f4dd617e919b"
  },
  "type": "customer.subscription.created"
}

```