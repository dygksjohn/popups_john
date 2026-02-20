import EventList from "./_components/EventList";

export default function Closed() {
  return (
    <EventList
      title="종료된 행사"
      statusList={["ENDED", "CANCELLED"]}
      buttonConfig={{
        showWhen: () => false,
      }}
    />
  );
}
