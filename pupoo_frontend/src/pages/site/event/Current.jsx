import EventList from "./_components/EventList";

export default function Current() {
  return <EventList title="현재 진행 행사" statusList={["ONGOING"]} />;
}
