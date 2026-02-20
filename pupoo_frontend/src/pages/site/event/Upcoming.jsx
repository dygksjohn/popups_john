import EventList from "./_components/EventList";

export default function Upcoming() {
  return (
    <EventList
      title="예정중인 행사"
      statusList={["PLANNED"]}
      buttonConfig={{
        showWhen: (ev) => ev.status === "PLANNED",
        primaryText: "사전신청",
        secondaryText: "사전신청확인",
      }}
    />
  );
}
