// app/page.tsx
// this is the main page of the app (home)
import EventList from './(components)/eventList';

type Event = {
  id: string;
  name: string;
  date: string;
  venue: string;
  available: boolean;
};

// const mockEvents: Event[] = [
//   {
//     id: '1',
//     name: 'Concert: Electric Waves',
//     date: '2025-11-15',
//     venue: 'Marina Bay Sands',
//     available: true
//   },
//   {
//     id: '2',
//     name: 'Theatre: Hamlet Reimagined',
//     date: '2025-12-03',
//     venue: 'Esplanade Theatre',
//     available: false
//   },
//   {
//     id: '3',
//     name: 'Festival: Indie Beats',
//     date: '2025-12-25',
//     venue: 'Fort Canning Park',
//     available: true
//   }
// ];

export default function HomePage() {
  return (
    <section>
      <h1>Upcoming Events</h1>

      <EventList />
      {/* <ul style={{ padding: 0 }}>
        {mockEvents.map((event) => (
          <li key={event.id} style={{ marginBottom: '1.5rem', listStyle: 'none' }}>
            <div>
              <h2>{event.name}</h2>
              <p>Date: {event.date}</p>
              <p>Venue: {event.venue}</p>
              <p>Status: {event.available ? 'Available' : 'Sold Out'}</p>
              {event.available && (
                <a href={`/event/${event.id}`} style={{ color: 'blue', textDecoration: 'underline' }}>
                  View Details
                </a>
              )}
            </div>
          </li>
        ))}
      </ul> */}
    </section>
  );
}
