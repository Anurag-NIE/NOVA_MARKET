"""Quick script to verify orders were created for seller4"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from config import settings
from datetime import datetime, timezone, timedelta

async def verify_orders():
    client = AsyncIOMotorClient(settings.MONGO_URL)
    db = client[settings.DB_NAME]
    
    try:
        # Find seller
        seller = await db.users.find_one(
            {"email": {"$regex": "sller4|seller4", "$options": "i"}}, 
            {"_id": 0}
        )
        
        if not seller:
            print("Seller not found")
            return
            
        seller_id = seller.get('id')
        print(f"Seller: {seller.get('name')} ({seller.get('email')})")
        print(f"Seller ID: {seller_id}\n")
        
        # Get orders
        orders = await db.orders.find(
            {"seller_id": seller_id}
        ).to_list(100)
        
        print(f"Total orders found: {len(orders)}")
        
        # Check last 7 days
        today = datetime.now(timezone.utc)
        last7_days = []
        for i in range(7):
            date = today - timedelta(days=i)
            date_str = date.date().isoformat()
            last7_days.append(date_str)
        
        print(f"\nOrders in last 7 days ({last7_days[6]} to {last7_days[0]}):")
        
        for order in orders:
            order_date = order.get('created_at') or order.get('timestamp')
            if order_date:
                if isinstance(order_date, str):
                    try:
                        order_date = datetime.fromisoformat(order_date.replace('Z', '+00:00'))
                    except:
                        continue
                date_str = order_date.date().isoformat()
                
                if date_str in last7_days:
                    amount = order.get('total_amount', order.get('amount', 0))
                    print(f"  ✅ {date_str}: ${amount:.2f} - Status: {order.get('status')}")
        
        # Get bookings too
        bookings = await db.bookings.find(
            {"seller_id": seller_id}
        ).to_list(100)
        
        print(f"\nTotal bookings found: {len(bookings)}")
        print(f"\nBookings in last 7 days:")
        
        for booking in bookings:
            booking_date = booking.get('start_time') or booking.get('booked_at') or booking.get('created_at')
            if booking_date:
                if isinstance(booking_date, str):
                    try:
                        booking_date = datetime.fromisoformat(booking_date.replace('Z', '+00:00'))
                    except:
                        continue
                date_str = booking_date.date().isoformat()
                
                if date_str in last7_days:
                    amount = booking.get('price', booking.get('amount', 0))
                    print(f"  ✅ {date_str}: ${amount:.2f} - Status: {booking.get('status')}")
                    
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(verify_orders())

