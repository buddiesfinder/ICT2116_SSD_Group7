'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

// Define the seat category types
interface SeatCategory {
  id: string;
  name: string;
  price: number;
  color: string;
  availableSeats: number;
}

// Define seat selection state
interface SelectedSeat {
  category: string;
  quantity: number;
}

// Default event for demo purposes when no event ID is provided
const defaultEvent = {
  id: 'demo',
  title: 'Sample Event',
  date: 'Coming Soon',
  venue: 'Venue TBD',
  description: 'This is a sample event for demonstration purposes.',
  pricing: {
    cat1: 300,
    cat2: 200,
    cat3: 100
  }
};

// Default seat categories
const defaultSeatCategories: SeatCategory[] = [
  {
    id: 'cat1',
    name: 'Premium',
    price: 300,
    color: 'bg-red-500',
    availableSeats: 50
  },
  {
    id: 'cat2',
    name: 'Standard',
    price: 200,
    color: 'bg-blue-500',
    availableSeats: 100
  },
  {
    id: 'cat3',
    name: 'Economy',
    price: 100,
    color: 'bg-green-500',
    availableSeats: 200
  }
];

export default function SeatSelection() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const eventId = searchParams.get('eventId');
  
  const [event, setEvent] = useState<any>(defaultEvent);
  const [isLoading, setIsLoading] = useState(eventId ? true : false);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<SelectedSeat>({
    category: '',
    quantity: 0
  });
  
  // Define seat categories based on event pricing
  const [seatCategories, setSeatCategories] = useState<SeatCategory[]>(defaultSeatCategories);
  
  useEffect(() => {
    const fetchEventDetails = async () => {
      if (!eventId) {
        setIsLoading(false);
        return;
      }
      
      try {
        // In a real app, fetch from API using the eventId
        // For demo purposes, import the getEvents function
        const { getEvents } = await import('./eventList');
        const events = getEvents();
        const currentEvent = events.find(e => e.id === eventId);
        
        if (currentEvent) {
          setEvent(currentEvent);
          
          // Create seat categories from event pricing
          const categories: SeatCategory[] = [
            {
              id: 'cat1',
              name: 'Premium',
              price: currentEvent.pricing.cat1,
              color: 'bg-red-500',
              availableSeats: 50
            },
            {
              id: 'cat2',
              name: 'Standard',
              price: currentEvent.pricing.cat2,
              color: 'bg-blue-500',
              availableSeats: 100
            },
            {
              id: 'cat3',
              name: 'Economy',
              price: currentEvent.pricing.cat3,
              color: 'bg-green-500',
              availableSeats: 200
            }
          ];
          
          setSeatCategories(categories);
        } else {
          // If event not found, use default event
          setEvent(defaultEvent);
        }
      } catch (error) {
        console.error("Failed to fetch event details", error);
        // Fallback to default event if there's an error
        setEvent(defaultEvent);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchEventDetails();
  }, [eventId]);
  
  const handleCategoryHover = (categoryId: string | null) => {
    setHoveredCategory(categoryId);
  };
  
  const handleCategorySelect = (categoryId: string) => {
    setSelectedSeats({
      category: categoryId,
      quantity: 1
    });
  };
  
  const handleQuantityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedSeats({
      ...selectedSeats,
      quantity: parseInt(e.target.value)
    });
  };
  
  const proceedToCheckout = () => {
    // In a real app, save selection to state/context and navigate to checkout
    // For this demo, we'll just navigate with query params
    const selectedCategory = seatCategories.find(cat => cat.id === selectedSeats.category);
    if (!selectedCategory) return;
    
    const params = new URLSearchParams({
      eventId: eventId || 'demo',
      categoryId: selectedSeats.category,
      quantity: selectedSeats.quantity.toString(),
      price: (selectedCategory.price * selectedSeats.quantity).toString()
    });
    
    router.push(`/checkout?${params.toString()}`);
  };
  
  if (isLoading) return <div className="text-center p-12">Loading seating information...</div>;
  
  const getSelectedCategory = () => {
    return seatCategories.find(cat => cat.id === selectedSeats.category);
  };
  
  const totalPrice = getSelectedCategory() ? getSelectedCategory()!.price * selectedSeats.quantity : 0;
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Link href="/" className="text-blue-600 hover:underline mb-4 inline-block">
          ← Back to Events
        </Link>
        <h1 className="text-3xl font-bold mb-2">{event.title}</h1>
        <p className="text-gray-600">{event.date} • {event.venue}</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Seat Map */}
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4">Select Your Seats</h2>
          
          <div className="relative">
            {/* Stage area */}
            <div className="w-full h-16 bg-gray-800 rounded-t-3xl flex items-center justify-center mb-8">
              <p className="text-white font-semibold">STAGE</p>
            </div>
            
            {/* Seating sections */}
            <div className="relative w-full h-96 bg-gray-100 rounded-lg overflow-hidden">
              {/* Premium section - closest to stage */}
              <div 
                className={`absolute top-0 left-0 w-full h-1/3 ${
                  hoveredCategory === 'cat1' || selectedSeats.category === 'cat1' 
                    ? 'bg-red-500 opacity-80' 
                    : 'bg-red-300 opacity-50'
                } cursor-pointer transition-all duration-300`}
                onMouseEnter={() => handleCategoryHover('cat1')}
                onMouseLeave={() => handleCategoryHover(null)}
                onClick={() => handleCategorySelect('cat1')}
              >
                <div className="flex h-full items-center justify-center">
                  <p className="text-white font-bold text-xl">Premium Seating</p>
                </div>
              </div>
              
              {/* Standard section - middle area */}
              <div 
                className={`absolute top-1/3 left-0 w-full h-1/3 ${
                  hoveredCategory === 'cat2' || selectedSeats.category === 'cat2' 
                    ? 'bg-blue-500 opacity-80' 
                    : 'bg-blue-300 opacity-50'
                } cursor-pointer transition-all duration-300`}
                onMouseEnter={() => handleCategoryHover('cat2')}
                onMouseLeave={() => handleCategoryHover(null)}
                onClick={() => handleCategorySelect('cat2')}
              >
                <div className="flex h-full items-center justify-center">
                  <p className="text-white font-bold text-xl">Standard Seating</p>
                </div>
              </div>
              
              {/* Economy section - furthest from stage */}
              <div 
                className={`absolute top-2/3 left-0 w-full h-1/3 ${
                  hoveredCategory === 'cat3' || selectedSeats.category === 'cat3' 
                    ? 'bg-green-500 opacity-80' 
                    : 'bg-green-300 opacity-50'
                } cursor-pointer transition-all duration-300`}
                onMouseEnter={() => handleCategoryHover('cat3')}
                onMouseLeave={() => handleCategoryHover(null)}
                onClick={() => handleCategorySelect('cat3')}
              >
                <div className="flex h-full items-center justify-center">
                  <p className="text-white font-bold text-xl">Economy Seating</p>
                </div>
              </div>
            </div>
            
            {/* Category legend */}
            <div className="mt-6 flex flex-wrap gap-4">
              {seatCategories.map(category => (
                <div key={category.id} className="flex items-center">
                  <div className={`w-4 h-4 rounded-full ${category.color}`}></div>
                  <span className="ml-2">{category.name} - ${category.price}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Selection summary */}
        <div className="bg-white p-6 rounded-lg shadow-md h-fit">
          <h2 className="text-xl font-bold mb-4">Your Selection</h2>
          
          {selectedSeats.category ? (
            <>
              <div className="mb-4">
                <p className="font-semibold">{getSelectedCategory()?.name} Section</p>
                <p className="text-sm text-gray-600">${getSelectedCategory()?.price} per ticket</p>
              </div>
              
              <div className="mb-6">
                <label htmlFor="quantity" className="block mb-2 text-sm font-medium">
                  Number of tickets:
                </label>
                <select 
                  id="quantity" 
                  value={selectedSeats.quantity}
                  onChange={handleQuantityChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                    <option key={num} value={num}>
                      {num} {num === 1 ? 'ticket' : 'tickets'}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="border-t border-gray-200 pt-4 mb-6">
                <div className="flex justify-between mb-2">
                  <span>Tickets ({selectedSeats.quantity})</span>
                  <span>${getSelectedCategory()?.price} × {selectedSeats.quantity}</span>
                </div>
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>${totalPrice}</span>
                </div>
              </div>
              
              <button 
                onClick={proceedToCheckout}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-md transition-colors"
              >
                Continue to Checkout
              </button>
            </>
          ) : (
            <p className="text-gray-600">Select a seating category from the map to continue.</p>
          )}
        </div>
      </div>
    </div>
  );
}