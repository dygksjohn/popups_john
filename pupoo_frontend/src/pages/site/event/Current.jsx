import EventList from "./_components/EventList";

export default function Current() {
  return (
    <EventList
      title="현재 진행중인 행사"
      statusList={["ONGOING"]}
      buttonConfig={{
        showWhen: (ev) => ev.status === "ONGOING",
        primaryText: "신청",
        secondaryText: "신청확인",
      }}
    />
  );
}
