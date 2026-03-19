String url = "jdbc:mysql://pupoodb.c50c2i048hc8.ap-northeast-2.rds.amazonaws.com:3306/pupoodb?serverTimezone=Asia/Seoul&characterEncoding=UTF-8&useUnicode=true&useSSL=false&allowPublicKeyRetrieval=true";
try (java.sql.Connection conn = java.sql.DriverManager.getConnection(url, "pupoo", "pupoo1234!");
     java.sql.Statement st = conn.createStatement()) {
    try (java.sql.ResultSet rs = st.executeQuery("select count(*) from booth_waits")) {
        rs.next();
        System.out.println("booth_waits count=" + rs.getLong(1));
    }
    try (java.sql.ResultSet rs = st.executeQuery("select count(*) from experience_waits")) {
        rs.next();
        System.out.println("experience_waits count=" + rs.getLong(1));
    }
    try (java.sql.ResultSet rs = st.executeQuery("select count(*) from booths")) {
        rs.next();
        System.out.println("booths count=" + rs.getLong(1));
    }
}
/exit
