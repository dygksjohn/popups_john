import EventList from "./_components/EventList";

export default function Upcoming() {
  return <EventList title="예정 행사" statusList={["PLANNED"]} />;
}
