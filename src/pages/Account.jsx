import React, { useState, useEffect } from 'react'
import Cookies from 'js-cookie';

export default function Account() {
  const storedPhoneNumber = Cookies.get('phoneNumber');
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch(`/api/orders?pn=${storedPhoneNumber}`);

        if (response.ok) {
          // Assuming your API returns the orders in the 'orders' field
          if (response.ok) {
            const data = await response.json();
            const ordersData = data.orders;
            ordersData.map(order => {
              const deliveredAt = new Date(order.deliveredAt);
              const now = new Date();

              const diffInMs = now - deliveredAt;
              const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

              const returnAllowed = diffInDays <= 3;

              order.returnAllowed = returnAllowed;

              return order;
            });

            setOrders(ordersData);
          } else {
            console.error('Failed to fetch orders:', response.status);
          }
        }
      } catch (error) {
        console.error('Error fetching orders:', error);
      }
    }

    fetchOrders();
  }, []);

  console.log(orders)

  if (!storedPhoneNumber) {
    return <div className="text-center py-10">Please login to view your account.</div>;
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-cream-50 py-6">
      <div className="max-w-3xl mx-auto px-6">
        <h2 className="text-3xl font-semibold text-navy-700 mb-4">Your Orders</h2>
        {orders.length === 0 ? (
          <div className="text-center py-4">No orders found.</div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-md shadow-sm p-4">
                <h3 className="text-lg font-medium">Order #{order.id}</h3>
                <p className="text-sm text-gray-500">Order Placed at: {new Date(order.createdAt).toLocaleDateString()}</p>
                {
                  order.deliveredAt &&
                  <p className="text-sm text-gray-500">Delivery Date: {new Date(order.deliveredAt).toLocaleDateString()}</p>
                }
                <p className="text-base font-semibold text-navy-700">Total: ₹{order.amountINR}</p>
                <ul className="list-disc pl-5">
                  {order.items.map((item) => (
                    <li key={item.id} className="text-gray-700">
                      {item.name} - Quantity: {item.quantity}
                    </li>
                  ))}
                </ul>
                {/* Return Action Button */}
                {
                  order.deliveredAt &&
                  <button disabled={!order.returnAllowed} className="bg-teal-500 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded">
                    Return Items

                    {
                      !order.returnAllowed &&
                      <span class="text-red-500 ml-2">Returns cannot be placed after 3 days of delivery.</span>
                    }
                  </button>
                }
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
