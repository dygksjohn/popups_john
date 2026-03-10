import java.sql.*;
String url = "jdbc:mysql://localhost:3306/pupoodb?serverTimezone=Asia/Seoul&characterEncoding=UTF-8&useUnicode=true&useSSL=false&allowPublicKeyRetrieval=true";
try (Connection conn = DriverManager.getConnection(url, "pupoo", "pupoo1234!")) {
    PreparedStatement ps = conn.prepareStatement("select status, count(*) cnt from event_apply where event_id=? group by status order by status");
    ps.setLong(1, 17L);
    ResultSet rs = ps.executeQuery();
    while (rs.next()) {
        System.out.println(rs.getString(1) + "=" + rs.getLong(2));
    }
}
/exit
