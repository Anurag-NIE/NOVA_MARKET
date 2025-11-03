"""
Script to add test orders for seller4@gmail.com to raise the graph
This creates orders spread across the last 7 days
"""
import asyncio
from datetime import datetime, timezone, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
from config import settings
import uuid

async def add_test_orders():
    """Add test orders for seller4@gmail.com"""
    
    # Connect to MongoDB
    client = AsyncIOMotorClient(settings.MONGO_URL)
    db = client[settings.DB_NAME]
    
    try:
        # Find the seller - try multiple variations
        seller = None
        seller_emails_to_try = [
            "seller4@gmail.com",
            "sller4@gamil.com",  # Actual email with typo
            "seller4@gamil.com"
        ]
        
        for email in seller_emails_to_try:
            seller = await db.users.find_one({"email": email}, {"_id": 0})
            if seller:
                break
        
        # If not found, try case-insensitive or partial match
        if not seller:
            seller = await db.users.find_one(
                {"email": {"$regex": "seller4|sller4", "$options": "i"}}, 
                {"_id": 0}
            )
        
        if not seller:
            print(f"❌ Seller with email containing 'seller4' not found!")
            print("Available sellers:")
            all_sellers = await db.users.find({"role": "seller"}, {"_id": 0, "email": 1, "name": 1, "id": 1}).to_list(100)
            for s in all_sellers:
                print(f"  - {s.get('email')} ({s.get('name')})")
            return
        
        seller_id = seller.get('id')
        seller_name = seller.get('name', seller.get('email', 'seller4'))
        
        print(f"✅ Found seller: {seller_name} ({seller.get('email')})")
        print(f"   Seller ID: {seller_id}")
        
        # Find or create a test buyer
        buyer = await db.users.find_one({"role": "buyer"}, {"_id": 0})
        if not buyer:
            # Create a test buyer if none exists
            buyer_id = str(uuid.uuid4())
            buyer_name = "Test Buyer"
            buyer_email = "testbuyer@example.com"
            await db.users.insert_one({
                "id": buyer_id,
                "email": buyer_email,
                "name": buyer_name,
                "role": "buyer",
                "password": "hashed_password_placeholder"
            })
            print(f"✅ Created test buyer: {buyer_email}")
        else:
            buyer_id = buyer.get('id')
            buyer_name = buyer.get('name', 'Test Buyer')
            print(f"✅ Using existing buyer: {buyer_name}")
        
        # Get seller's products (to use in orders)
        products = await db.products.find(
            {"seller_id": seller_id}, 
            {"_id": 0, "id": 1, "title": 1, "price": 1}
        ).to_list(10)
        
        if not products:
            print("⚠️  No products found for this seller. Creating orders without specific products.")
            products = [{"id": "placeholder", "title": "Test Product", "price": 25.00}]
        
        # First, delete old test orders and bookings to avoid duplicates
        print("\n🗑️  Cleaning up old test data...")
        deleted_orders = await db.orders.delete_many({
            "seller_id": seller_id,
            "stripe_session_id": {"$regex": "^test_session_"}
        })
        deleted_bookings = await db.bookings.delete_many({
            "seller_id": seller_id,
            "service_title": {"$regex": "^Test Service"}
        })
        print(f"   Deleted {deleted_orders.deleted_count} old orders and {deleted_bookings.deleted_count} bookings")
        
        # Create a better sales pattern - ensure every day has sales with an upward trend
        today = datetime.now(timezone.utc)
        orders_created = 0
        bookings_created = 0
        
        # Create a smooth, linear upward trend - NO ZERO DAYS, BETTER SLOPE
        # Calculate amounts using a linear formula: base + (day_index * increment)
        # This creates a smooth progression from day 1 to day 7
        print("\n📊 Creating smooth sales data for the last 7 days...")
        print(f"   Today's date: {today.date().isoformat()}")
        print(f"   Pattern: Linear upward trend with smooth slope\n")
        
        # Get seller's services
        services = await db.services.find(
            {"seller_id": seller_id}, 
            {"_id": 0, "id": 1, "title": 1, "price": 1}
        ).to_list(10)
        
        if not services:
            print("⚠️  No services found. Will create placeholder service bookings.")
            services = [{"id": "placeholder_service", "title": "Test Service", "price": 150.00}]
        
        total_revenue = 0
        
        # Define smooth progression values
        # Day 1 starts at 40, each day increases by ~25-30 for smooth slope
        # Total daily sales: ~40, ~70, ~100, ~130, ~160, ~190, ~220
        base_order_amounts = [25.00, 35.00, 45.00, 55.00, 65.00, 75.00, 85.00]
        extra_order_amounts = [15.00, 20.00, 25.00, 30.00, 35.00, 40.00, 45.00]
        booking_amounts = [20.00, 25.00, 30.00, 35.00, 40.00, 45.00, 50.00]
        
        for i in range(7):
            # Calculate date (i days ago) - spread across 7 days
            order_date = today - timedelta(days=6-i)  # From 6 days ago to today
            order_date = order_date.replace(hour=10 + i, minute=30, second=0, microsecond=0)
            
            day_orders = []
            day_bookings = []
            
            # Always create a base order for every day (including Tue and Wed)
            base_order_amount = base_order_amounts[i]
            product = products[i % len(products)]
            
            order_id = str(uuid.uuid4())
            order = {
                "id": order_id,
                "buyer_id": buyer_id,
                "buyer_name": buyer_name,
                "seller_id": seller_id,
                "seller_name": seller_name,
                "product_ids": [product.get("id", "placeholder")],
                "products": [{
                    **product,
                    "quantity": 1,
                    "subtotal": base_order_amount
                }],
                "total_amount": base_order_amount,
                "status": "confirmed",
                "payment_status": "paid",
                "stripe_session_id": f"test_session_{order_id}",
                "created_at": order_date,
                "timestamp": order_date.isoformat()
            }
            await db.orders.insert_one(order)
            orders_created += 1
            total_revenue += base_order_amount
            day_orders.append(base_order_amount)
            
            # Add extra order for all days to create smoother progression
            extra_order_amount = extra_order_amounts[i]
            extra_order_date = order_date.replace(hour=15, minute=0, second=0, microsecond=0)
            
            extra_order_id = str(uuid.uuid4())
            extra_order = {
                "id": extra_order_id,
                "buyer_id": buyer_id,
                "buyer_name": buyer_name,
                "seller_id": seller_id,
                "seller_name": seller_name,
                "product_ids": [products[(i+1) % len(products)].get("id", "placeholder")],
                "products": [{
                    **products[(i+1) % len(products)],
                    "quantity": 1,
                    "subtotal": extra_order_amount
                }],
                "total_amount": extra_order_amount,
                "status": "confirmed",
                "payment_status": "paid",
                "stripe_session_id": f"test_session_{extra_order_id}",
                "created_at": extra_order_date,
                "timestamp": extra_order_date.isoformat()
            }
            await db.orders.insert_one(extra_order)
            orders_created += 1
            total_revenue += extra_order_amount
            day_orders.append(extra_order_amount)
            
            # Add service bookings for ALL days (including Tue and Wed) with incremental amounts
            booking_amount = booking_amounts[i]
            booking_date = order_date.replace(hour=14, minute=0, second=0, microsecond=0)
            
            service = services[i % len(services)]
            booking_id = str(uuid.uuid4())
            
            booking = {
                "id": booking_id,
                "buyer_id": buyer_id,
                "buyer_name": buyer_name,
                "seller_id": seller_id,
                "seller_name": seller_name,
                "service_id": service.get("id", "placeholder_service"),
                "service_title": service.get("title", "Test Service"),
                "price": booking_amount,
                "status": "completed",
                "start_time": booking_date.isoformat(),
                "booked_at": booking_date.isoformat(),
                "created_at": booking_date,
                "completed_at": (booking_date + timedelta(days=2)).isoformat()
            }
            
            await db.bookings.insert_one(booking)
            bookings_created += 1
            total_revenue += booking_amount
            day_bookings.append(booking_amount)
            
            # Calculate day total
            day_total = sum(day_orders) + sum(day_bookings)
            orders_str = f"Orders: ${sum(day_orders):.2f}" if day_orders else ""
            bookings_str = f"Bookings: ${sum(day_bookings):.2f}" if day_bookings else ""
            details = ", ".join(filter(None, [orders_str, bookings_str]))
            
            print(f"  ✅ Day {i+1} ({order_date.strftime('%Y-%m-%d')}): ${day_total:.2f} total ({details})")
        
        print(f"\n🎉 Successfully created:")
        print(f"   📦 {orders_created} product orders")
        print(f"   📅 {bookings_created} service bookings")
        print(f"   💰 Total revenue: ${total_revenue:.2f}")
        
        # Calculate expected daily totals for verification
        expected_totals = [sum([base_order_amounts[i], extra_order_amounts[i], booking_amounts[i]]) for i in range(7)]
        print(f"\n📈 Graph will show:")
        print(f"   - Smooth linear progression from ${expected_totals[0]:.2f} (Day 1) to ${expected_totals[6]:.2f} (Day 7)")
        print(f"   - Consistent ~$30 increase per day for smooth slope")
        print(f"   - NO ZERO DAYS - every day (including Tue & Wed) has sales data!")
        print(f"   - Better slope with gradual, consistent upward trend")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        client.close()

if __name__ == "__main__":
    print("🚀 Starting to add test orders for seller4@gmail.com...\n")
    asyncio.run(add_test_orders())
    print("\n✅ Done!")

