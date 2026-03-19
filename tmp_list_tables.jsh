String url = "jdbc:mysql://pupoodb.c50c2i048hc8.ap-northeast-2.rds.amazonaws.com:3306/pupoodb?serverTimezone=Asia/Seoul&characterEncoding=UTF-8&useUnicode=true&useSSL=false&allowPublicKeyRetrieval=true";
try (java.sql.Connection conn = java.sql.DriverManager.getConnection(url, "pupoo", "pupoo1234!")) {
    try (java.sql.PreparedStatement ps = conn.prepareStatement(
            "select table_name from information_schema.tables where table_schema='pupoodb' order by table_name");
         java.sql.ResultSet rs = ps.executeQuery()) {
        while (rs.next()) {
            System.out.println(rs.getString(1));
        }
    }
}
/exit
