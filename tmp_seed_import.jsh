String url = "jdbc:mysql://pupoodb.c50c2i048hc8.ap-northeast-2.rds.amazonaws.com:3306/pupoodb?serverTimezone=Asia/Seoul&characterEncoding=UTF-8&useUnicode=true&useSSL=false&allowPublicKeyRetrieval=true";
String user = "pupoo";
String pass = "pupoo1234!";
java.nio.file.Path sqlPath = java.nio.file.Paths.get("C:/pupoo_workspace/popups/db/pupoo_seed_v6.6_practical_image_urls_rewritten.sql");

String sql = java.nio.file.Files.readString(sqlPath, java.nio.charset.StandardCharsets.UTF_8);
java.util.List<String> statements = new java.util.ArrayList<>();
StringBuilder current = new StringBuilder();
boolean inSingle = false;
boolean inDouble = false;
boolean inBacktick = false;
boolean inLineComment = false;
boolean inBlockComment = false;

for (int i = 0; i < sql.length(); i++) {
    char c = sql.charAt(i);
    char n = (i + 1 < sql.length()) ? sql.charAt(i + 1) : '\0';

    if (inLineComment) {
        if (c == '\n') {
            inLineComment = false;
        }
        continue;
    }
    if (inBlockComment) {
        if (c == '*' && n == '/') {
            inBlockComment = false;
            i++;
        }
        continue;
    }

    if (!inSingle && !inDouble && !inBacktick) {
        if (c == '-' && n == '-') {
            inLineComment = true;
            i++;
            continue;
        }
        if (c == '#') {
            inLineComment = true;
            continue;
        }
        if (c == '/' && n == '*') {
            inBlockComment = true;
            i++;
            continue;
        }
    }

    if (c == '\'' && !inDouble && !inBacktick) {
        boolean escaped = i > 0 && sql.charAt(i - 1) == '\\';
        if (!escaped) {
            inSingle = !inSingle;
        }
        current.append(c);
        continue;
    }
    if (c == '"' && !inSingle && !inBacktick) {
        boolean escaped = i > 0 && sql.charAt(i - 1) == '\\';
        if (!escaped) {
            inDouble = !inDouble;
        }
        current.append(c);
        continue;
    }
    if (c == '`' && !inSingle && !inDouble) {
        inBacktick = !inBacktick;
        current.append(c);
        continue;
    }

    if (c == ';' && !inSingle && !inDouble && !inBacktick) {
        String stmt = current.toString().trim();
        if (!stmt.isEmpty()) {
            statements.add(stmt);
        }
        current.setLength(0);
        continue;
    }

    current.append(c);
}

String tail = current.toString().trim();
if (!tail.isEmpty()) {
    statements.add(tail);
}

System.out.println("Total statements: " + statements.size());

long start = System.currentTimeMillis();
try (java.sql.Connection conn = java.sql.DriverManager.getConnection(url, user, pass);
     java.sql.Statement st = conn.createStatement()) {
    conn.setAutoCommit(true);
    st.execute("SET SESSION innodb_lock_wait_timeout = 120");
    int executed = 0;
    for (String stmt : statements) {
        String stmtToRun = stmt;
        String lower = stmt.trim().toLowerCase(java.util.Locale.ROOT);
        if (lower.startsWith("insert into booth_waits ")) {
            stmtToRun = stmt + " ON DUPLICATE KEY UPDATE wait_count=VALUES(wait_count), wait_min=VALUES(wait_min), updated_at=VALUES(updated_at)";
        } else if (lower.startsWith("insert into experience_waits ")) {
            stmtToRun = stmt + " ON DUPLICATE KEY UPDATE wait_count=VALUES(wait_count), wait_min=VALUES(wait_min), updated_at=VALUES(updated_at)";
        }
        int attempt = 0;
        while (true) {
            try {
                st.execute(stmtToRun);
                break;
            } catch (Exception e) {
                String msg = e.getMessage() == null ? "" : e.getMessage();
                if (msg.contains("Lock wait timeout exceeded") && attempt < 20) {
                    attempt++;
                    System.out.println("Lock wait retry " + attempt + " at statement #" + (executed + 1));
                    try {
                        Thread.sleep(2000);
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                    }
                    continue;
                }
                System.out.println("FAILED at statement #" + (executed + 1));
                String preview = stmtToRun.length() > 400 ? stmtToRun.substring(0, 400) + "..." : stmtToRun;
                System.out.println(preview);
                throw e;
            }
        }
        executed++;
        if (executed % 10 == 0) {
            System.out.println("Executed " + executed + " / " + statements.size());
        }
    }
    long elapsed = System.currentTimeMillis() - start;
    System.out.println("Seed import completed. executed=" + executed + ", elapsedMs=" + elapsed);
}
/exit
