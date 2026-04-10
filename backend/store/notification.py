import africastalking
from django.core.mail import send_mail
from django.conf import settings


# Initialize Africa's Talking
try:
    africastalking.initialize(
        username=settings.AFRICAS_TALKING_USERNAME,
        api_key=settings.AFRICAS_TALKING_API_KEY
    )
    sms = africastalking.SMS
    print("Africa's Talking initialized successfully")
except Exception as e:
    print(f" Africa's Talking initialization error: {e}")
    sms = None


def send_admin_email(order):
    """Send email notification to ADMIN"""
    try:
        subject = f'New Order - {order.order_number}'
        
        # HTML email for admin
        html_message = f"""
        <html>
        <body style="font-family: Arial, sans-serif; color: #2C1810; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #2C1810 0%, #8B4513 100%); padding: 30px; text-align: center;">
                <h1 style="color: #D4AF37; margin: 0; font-size: 36px;">Cropped By Ayerkie - Admin Alert</h1>
                <p style="color: white; margin: 10px 0 0; font-size: 16px;">New Order Received!</p>
            </div>
            
            <div style="padding: 30px; background-color: #FFF8F0;">
                <h2 style="color: #2C1810;"> New Order Alert</h2>
                
                <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4CAF50;">
                    <h3 style="color: #2C1810; margin-top: 0;">Order Details</h3>
                    <p style="font-size: 15px; margin: 8px 0;"><strong>Order Number:</strong> {order.order_number}</p>
                    <p style="font-size: 15px; margin: 8px 0;"><strong>Total Amount:</strong> GH₵{order.total_amount}</p>
                    <p style="font-size: 15px; margin: 8px 0;"><strong>Payment Method:</strong> {order.get_payment_method_display()}</p>
                    <p style="font-size: 15px; margin: 8px 0;"><strong>Status:</strong> Pending</p>
                </div>
                
                <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="color: #2C1810; margin-top: 0;">Customer Information</h3>
                    <p style="font-size: 15px; margin: 8px 0;"><strong>Name:</strong> {order.first_name} {order.last_name}</p>
                    <p style="font-size: 15px; margin: 8px 0;"><strong>Email:</strong> {order.email}</p>
                    <p style="font-size: 15px; margin: 8px 0;"><strong>Phone:</strong> {order.phone}</p>
                </div>
                
                <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="color: #2C1810; margin-top: 0;">Delivery Address</h3>
                    <p style="font-size: 15px; line-height: 1.6;">
                        {order.delivery_address}<br>
                        {order.delivery_city}, {order.delivery_state}<br>
                        {order.delivery_postal_code}<br>
                        {order.delivery_country}
                    </p>
                </div>
                
                <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="color: #2C1810; margin-top: 0;">Order Items</h3>
                    {"".join([f'<p style="font-size: 15px; margin: 8px 0; padding-left: 10px; border-left: 3px solid #D4AF37;">• {item.product.name} (Size: {item.size}) × {item.quantity} - GH₵{item.total_price}</p>' for item in order.items.all()])}
                </div>
                
                <div style="background-color: #FFF3E0; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #FFE0B2; text-align: center;">
                    <p style="margin: 10px 0;">
                        <a href="http://localhost:3000/admin/orders" 
                           style="display: inline-block; background-color: #D4AF37; color: #2C1810; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                            View in Admin Dashboard
                        </a>
                    </p>
                </div>
                
                {order.notes and f'<div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0;"><h3 style="color: #2C1810; margin-top: 0;">Customer Notes</h3><p>{order.notes}</p></div>' or ''}
            </div>
            
            <div style="background-color: #2C1810; padding: 20px; text-align: center; color: white; font-size: 12px;">
                <p style="margin: 0;">© 2026 Cropped By Ayerkie. All rights reserved.</p>
                <p style="margin: 5px 0 0;">UHAS Campus, Ho, Volta Region, Ghana</p>
            </div>
        </body>
        </html>
        """
        
        plain_message = f"""
        NEW ORDER RECEIVED!
        
        Order Number: {order.order_number}
        Total Amount: GH₵{order.total_amount}
        Payment Method: {order.get_payment_method_display()}
        
        Customer: {order.first_name} {order.last_name}
        Email: {order.email}
        Phone: {order.phone}
        
        Delivery Address:
        {order.delivery_address}
        {order.delivery_city}, {order.delivery_state}
        {order.delivery_postal_code}, {order.delivery_country}
        
        Order Items:
        {"".join([f'- {item.product.name} (Size: {item.size}) × {item.quantity} - GH₵{item.total_price}\n' for item in order.items.all()])}
        
        Check admin dashboard to process this order.
        """
        
        # Send to ADMIN email (from settings or use a specific admin email)
        admin_email = getattr(settings, 'ADMIN_EMAIL', settings.EMAIL_HOST_USER)
        
        send_mail(
            subject=subject,
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[admin_email],
            html_message=html_message,
            fail_silently=False,
        )
        
        print(f" Email sent to admin: {admin_email}")
        return True
    except Exception as e:
        print(f" Admin email error: {e}")
        return False


def send_customer_sms(order):
    """Send SMS notification to CUSTOMER"""
    if not sms:
        print("SMS service not initialized")
        return False
    
    try:
        message = (
            f"Hi {order.first_name}! Your Cropped By Ayerkie order #{order.order_number} "
            f"(GH₵{order.total_amount}) has been received. "
            f"We'll notify you when it ships. Thank you for shopping with us!"
        )
        
        response = sms.send(message, [order.phone])
        print(f" SMS sent to customer {order.phone}: {response}")
        return True
    except Exception as e:
        print(f" Customer SMS error: {e}")
        return False


def send_status_update_sms(order, new_status):
    """Send SMS to customer when order status changes"""
    if not sms:
        return False
    
    try:
        status_messages = {
            'processing': f"Good news! Your Cropped By Ayerkie order #{order.order_number} payment has been confirmed and we're preparing it for delivery.",
            'shipped': f"Your Cropped By Ayerkie order #{order.order_number} is on its way! You should receive it soon. Track: http://localhost:3000/track-order",
            'delivered': f"Your Cropped By Ayerkie order #{order.order_number} has been delivered! Thank you for shopping with us. We hope you love it! 💕",
            'cancelled': f"Your Cropped By Ayerkie order #{order.order_number} has been cancelled. If you have questions, please call us at +233 24 123 4567.",
        }
        
        message = status_messages.get(new_status)
        if message:
            response = sms.send(message, [order.phone])
            print(f" Status update SMS sent: {new_status}")
            return True
        return False
    except Exception as e:
        print(f" Status SMS error: {e}")
        return False


def send_order_notifications(order):
    """
    Send order notifications:
    - SMS to CUSTOMER (PAID ~GH₵0.053)
    - Email to ADMIN (FREE)
    """
    
    # 1. SMS to customer
    send_customer_sms(order)
    
    # 2. Email to admin
    send_admin_email(order)