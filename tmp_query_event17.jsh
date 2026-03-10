import java.sql.*;
String url = "jdbc:mysql://localhost:3306/pupoodb?serverTimezone=Asia/Seoul&characterEncoding=UTF-8&useUnicode=true&useSSL=false&allowPublicKeyRetrieval=true";
try (Connection conn = DriverManager.getConnection(url, "pupoo", "pupoo1234!")) {
    long eventId = 17L;

    PreparedStatement ps1 = conn.prepareStatement("select count(*) from event_apply where event_id=? and status in ('APPLIED','APPROVED')");
    ps1.setLong(1, eventId);
    ResultSet rs1 = ps1.executeQuery(); rs1.next(); long activeApply = rs1.getLong(1);

    PreparedStatement ps2 = conn.prepareStatement("select count(*) from event_program where event_id=? and start_at <= now() and end_at >= now()");
    ps2.setLong(1, eventId);
    ResultSet rs2 = ps2.executeQuery(); rs2.next(); long runningPrograms = rs2.getLong(1);

    PreparedStatement ps3 = conn.prepareStatement("select coalesce(sum(wait_count),0), coalesce(avg(case when wait_min > 0 then wait_min end),0) from booth_waits bw join booths b on b.booth_id=bw.booth_id where b.event_id=?");
    ps3.setLong(1, eventId);
    ResultSet rs3 = ps3.executeQuery(); rs3.next(); double boothTotalWait = rs3.getDouble(1); double boothAvgWait = rs3.getDouble(2);

    PreparedStatement ps4 = conn.prepareStatement("select coalesce(sum(wait_count),0), coalesce(avg(case when wait_min > 0 then wait_min end),0) from experience_waits ew join event_program p on p.program_id=ew.program_id where p.event_id=?");
    ps4.setLong(1, eventId);
    ResultSet rs4 = ps4.executeQuery(); rs4.next(); double expTotalWait = rs4.getDouble(1); double expAvgWait = rs4.getDouble(2);

    PreparedStatement ps5 = conn.prepareStatement("select coalesce(avg(wait_min),0) from (select bw.wait_min as wait_min from booth_waits bw join booths b on b.booth_id=bw.booth_id where b.event_id=? and bw.wait_min > 0 union all select ew.wait_min as wait_min from experience_waits ew join event_program p on p.program_id=ew.program_id where p.event_id=? and ew.wait_min > 0) t");
    ps5.setLong(1, eventId);
    ps5.setLong(2, eventId);
    ResultSet rs5 = ps5.executeQuery(); rs5.next(); double avgWaitCombined = rs5.getDouble(1);

    double totalWait = boothTotalWait + expTotalWait;
    double raw = activeApply * 0.18 + runningPrograms * 6.0 + totalWait * 0.95 + avgWaitCombined * 1.8;
    double clamped = Math.max(0.0, Math.min(100.0, Math.round(raw * 10.0) / 10.0));

    System.out.println("eventId=" + eventId);
    System.out.println("activeApply=" + activeApply);
    System.out.println("runningPrograms=" + runningPrograms);
    System.out.println("boothTotalWait=" + boothTotalWait + ", boothAvgWait=" + boothAvgWait);
    System.out.println("expTotalWait=" + expTotalWait + ", expAvgWait=" + expAvgWait);
    System.out.println("totalWait=" + totalWait + ", avgWaitCombined=" + avgWaitCombined);
    System.out.println("rawScore=" + raw + ", clampedBase=" + clamped);
}
/exit
