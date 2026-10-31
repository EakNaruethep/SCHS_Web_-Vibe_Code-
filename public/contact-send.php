<?php
// Contact form on /contact (replaces Makewebeasy's form). Runs on Hostatom's PHP.
//   GET  -> a new math question for the form: {"q":"4 + 2 =","token":"..."}
//   POST -> checks the answers and emails the message to MAIL_TO.
// Spam protection: math question signed with a secret, hidden "website" field that people never fill,
// at least 3 seconds between loading the question and sending, and at most 5 messages per hour from one address.

const MAIL_TO = 'schs.contact@gmail.com';
const SITE_NAME = 'ส.เจริญโฮมสแควร์';
const MAX_PER_HOUR = 5;
const TOKEN_LIFETIME = 3600;

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
mb_internal_encoding('UTF-8');
date_default_timezone_set('Asia/Bangkok');

function reply($data, $status = 200) {
  http_response_code($status);
  echo json_encode($data, JSON_UNESCAPED_UNICODE);
  exit;
}

// The secret is made on first use and kept in a PHP file, so visitors can't read it.
function secret() {
  $file = __DIR__ . '/.contact-secret.php';
  if (is_file($file)) return include $file;
  $s = bin2hex(random_bytes(32));
  if (@file_put_contents($file, "<?php return '$s';\n", LOCK_EX) === false) reply(['ok' => false, 'error' => 'server'], 500);
  return $s;
}

function sign($payload) { return hash_hmac('sha256', $payload, secret()); }

function store_file($name) {
  $dir = sys_get_temp_dir() . '/schs-contact';
  if (!is_dir($dir)) @mkdir($dir, 0700, true);
  return $dir . '/' . $name;
}

// Keeps a small JSON list of recent times per key (sends per address, used tokens).
function recent($name, $window, $add = null) {
  $file = store_file($name);
  $fh = fopen($file, 'c+');
  flock($fh, LOCK_EX);
  $list = json_decode(stream_get_contents($fh), true) ?: [];
  $now = time();
  foreach ($list as $k => $times) {
    $list[$k] = array_values(array_filter($times, fn($t) => $t > $now - $window));
    if (!$list[$k]) unset($list[$k]);
  }
  if ($add !== null) {
    $list[$add][] = $now;
    ftruncate($fh, 0); rewind($fh); fwrite($fh, json_encode($list));
  }
  flock($fh, LOCK_UN); fclose($fh);
  return $list;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
  $a = random_int(1, 9); $b = random_int(1, 9);
  $payload = ($a + $b) . '.' . time() . '.' . bin2hex(random_bytes(8));
  reply(['q' => "$a + $b =", 'token' => base64_encode($payload) . '.' . sign($payload)]);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') reply(['ok' => false, 'error' => 'method'], 405);

$in = fn($k) => trim((string)($_POST[$k] ?? ''));
$name = $in('name'); $email = $in('email'); $phone = $in('phone');
$type = $in('type'); $message = $in('message');

// Hidden field filled = a bot. Pretend it worked.
if ($in('website') !== '') reply(['ok' => true]);

$types = ['สนใจสั่งซื้อสินค้า', 'สอบถามข้อมูลเพิ่มเติม', 'อื่นๆ'];
if ($name === '' || $phone === '' || $message === '' || !in_array($type, $types, true)
    || !filter_var($email, FILTER_VALIDATE_EMAIL) || $in('accept') !== 'true'
    || mb_strlen($name) > 100 || mb_strlen($email) > 150 || mb_strlen($phone) > 30 || mb_strlen($message) > 3000) {
  reply(['ok' => false, 'error' => 'fields'], 400);
}

// Math question: signature, age and answer
[$encoded, $sig] = array_pad(explode('.', $in('token'), 2), 2, '');
$payload = (string)base64_decode($encoded, true);
[$answer, $issued] = array_pad(explode('.', $payload), 2, '0');
if (!hash_equals(sign($payload), $sig) || time() - (int)$issued > TOKEN_LIFETIME) reply(['ok' => false, 'error' => 'captcha'], 400);
if ($in('captcha') !== $answer) reply(['ok' => false, 'error' => 'captcha'], 400);
if (time() - (int)$issued < 3) reply(['ok' => false, 'error' => 'captcha'], 400);
if (isset(recent('tokens.json', TOKEN_LIFETIME)[$sig])) reply(['ok' => false, 'error' => 'captcha'], 400);

$ip = $_SERVER['REMOTE_ADDR'] ?? '';
$ipKey = hash('sha256', $ip);
if (count(recent('sends.json', 3600)[$ipKey] ?? []) >= MAX_PER_HOUR) reply(['ok' => false, 'error' => 'limit'], 429);

$host = preg_replace('/^www\./', '', strtolower($_SERVER['SERVER_NAME'] ?? 'schomesquare.co.th'));
$from = 'noreply@' . $host;
$oneLine = fn($s) => str_replace(["\r", "\n"], ' ', $s);

$subject = '=?UTF-8?B?' . base64_encode('ติดต่อจากเว็บไซต์: ' . $type . ' - ' . $oneLine($name)) . '?=';
$body = "ข้อความจากหน้า ติดต่อเรา บนเว็บไซต์ " . SITE_NAME . "\n\n"
  . "ชื่อ: $name\nอีเมล: $email\nเบอร์โทรศัพท์: $phone\nประเภทการติดต่อ: $type\n\nข้อความ:\n$message\n\n"
  . "--\nส่งเมื่อ " . date('Y-m-d H:i') . " จาก IP $ip\n";
$headers = implode("\r\n", [
  'From: =?UTF-8?B?' . base64_encode(SITE_NAME) . "?= <$from>",
  'Reply-To: ' . $oneLine($email),
  'MIME-Version: 1.0',
  'Content-Type: text/plain; charset=UTF-8',
  'Content-Transfer-Encoding: base64',
]);

if (!mail(MAIL_TO, $subject, chunk_split(base64_encode($body)), $headers, '-f' . $from)) reply(['ok' => false, 'error' => 'server'], 500);

recent('tokens.json', TOKEN_LIFETIME, $sig);
recent('sends.json', 3600, $ipKey);
reply(['ok' => true]);
