// 앱이 데이터를 받아오는 주소 (공개 데이터 저장소의 GitHub Pages).
// 매일 GitHub Actions(.github/workflows/daily-data.yml)가 갱신한다.
window.FED_DATA_URL = "https://wj08kim-arch.github.io/fed-rate-data/latest.json";

// 유료(PRO) 데이터 서버 (Supabase). url과 anon 키는 앱에 들어가는 공개용 값이다.
// 비워 두면 서버를 쓰지 않고 이 컴퓨터의 data/pro.json을 읽는다 (개발용).
// service_role 키는 절대 여기에 넣지 않는다 (GitHub Secrets에만).
window.FED_SUPABASE = { url: "https://nvouzmoljfpxgmjhgydg.supabase.co", anon: "sb_publishable_J6BsAELGH9eZvA2bGZib7Q_gSj-_DFO" };
