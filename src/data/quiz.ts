/** Đề trắc nghiệm tự đánh giá 40 câu (Chương 5) và đáp án Phụ lục B của tài liệu IT005. */
export interface QuizQ {
  n: number;
  chapter: 1 | 2 | 3;
  q: string;
  options: string[];
  /** chỉ số phương án đúng (0 = A) */
  answer: number;
  why: string;
}

const L = (c: string) => 'ABCD'.indexOf(c);

const raw: [1 | 2 | 3, string, string[], string, string][] = [
  [1, 'Gói 2000 byte truyền trên link 100 Mbps. Trễ truyền là:', ['$20\\,\\mu$s', '$160\\,\\mu$s', '2 ms', '$16\\,\\mu$s'], 'B', '$\\frac{16\\,000}{10^8} = 160\\,\\mu$s. A là kết quả khi quên nhân 8.'],
  [1, 'Link dài 4000 km, tốc độ lan truyền $2 \\times 10^8$ m/s. Trễ lan truyền là:', ['2 ms', '20 ms', '200 ms', '0.2 ms'], 'B', '$\\frac{4 \\times 10^6}{2 \\times 10^8} = 0.02$ s $= 20$ ms.'],
  [1, 'Loại trễ nào phụ thuộc vào mức độ tắc nghẽn của mạng?', ['Trễ xử lý', 'Trễ hàng đợi', 'Trễ truyền', 'Trễ lan truyền'], 'B', 'Trễ hàng đợi phụ thuộc lượng gói đang chờ, tức mức tắc nghẽn.'],
  [1, 'Đường đi qua 3 link 10 Mbps, 2 Mbps, 50 Mbps. Thông lượng đầu cuối là:', ['62 Mbps', '50 Mbps', '10 Mbps', '2 Mbps'], 'D', 'Thông lượng là min của các link: 2 Mbps.'],
  [1, 'Cường độ lưu lượng $I = La/R$ tiến dần tới 1 thì:', ['Trễ hàng đợi giảm về 0', 'Trễ hàng đợi tăng rất nhanh', 'Trễ truyền tăng gấp đôi', 'Trễ lan truyền tăng'], 'B', '$d_{\\text{queue}} \\approx \\frac{I}{1-I} \\cdot \\frac{L}{R}$ tăng vọt khi $I \\to 1$.'],
  [1, 'Đặc điểm nào thuộc chuyển mạch kênh?', ['Tài nguyên dùng chung theo nhu cầu', 'Lưu và chuyển từng gói', 'Tài nguyên được dành riêng sau khi thiết lập', 'Không cần thiết lập trước'], 'C', 'Chuyển mạch kênh dành riêng tài nguyên; A, B, D là chuyển mạch gói.'],
  [1, 'Link 1.536 Mbps chia TDM 24 khe; gửi file 640 000 bit, thiết lập kênh 500 ms. Tổng thời gian:', ['0.92 s', '10 s', '10.5 s', '24.5 s'], 'C', 'Mỗi khe 64 kbps: 10 s truyền + 0.5 s thiết lập.'],
  [1, '“Chuyển tiếp” (forwarding) là:', ['Tìm đường đi trên toàn mạng', 'Chuyển gói từ cổng vào tới cổng ra phù hợp ở một router', 'Chia gói thành các frame', 'Thiết lập kênh trước khi truyền'], 'B', 'Forwarding là cục bộ ở một router; A là routing.'],
  [1, 'Đơn vị dữ liệu của tầng mạng là:', ['Segment', 'Frame', 'Datagram', 'Message'], 'C', 'Tầng mạng: datagram.'],
  [1, 'Thiết bị nào xử lý tới tầng mạng (3 tầng dưới)?', ['Switch', 'Router', 'Hub', 'Repeater'], 'B', 'Router xử lý Physical, Link, Network.'],
  [1, 'Trong frame $[H_l \\mid H_n \\mid H_t \\mid M]$, header nào được bóc ra cuối cùng ở máy nhận?', ['$H_l$', '$H_n$', '$H_t$', 'Không header nào'], 'C', 'Máy nhận bóc $H_l$ ở tầng liên kết, $H_n$ ở tầng mạng, $H_t$ ở tầng vận chuyển (cuối cùng).'],
  [2, 'Mã trạng thái nào không kèm phần thân chứa đối tượng được yêu cầu?', ['200 OK', '304 Not Modified', 'Cả A và B', 'Không mã nào'], 'B', '304 báo bản cache còn mới, không gửi lại đối tượng.'],
  [2, 'Dòng nào biến một GET thành GET có điều kiện?', ['Host:', 'If-Modified-Since:', 'Connection:', 'Accept:'], 'B', 'If-Modified-Since làm request thành GET có điều kiện.'],
  [2, 'HTTP không bền vững, trang có 1 file HTML và 4 ảnh, không song song. Số RTT (bỏ qua thời gian truyền):', ['2', '5', '6', '10'], 'D', 'Mỗi đối tượng 2 RTT: $5 \\times 2 = 10$.'],
  [2, 'HTTP bền vững có pipelining, trang có 1 file HTML và 4 ảnh. Số RTT:', ['3', '4', '6', '10'], 'A', '2 RTT cho HTML, 1 RTT cho cả 4 ảnh (pipelining): 3.'],
  [2, 'Cookie gồm bao nhiêu thành phần?', ['2', '3', '4', '5'], 'C', 'Dòng Set-Cookie, dòng Cookie, file cookie ở máy người dùng, cơ sở dữ liệu ở server: 4.'],
  [2, 'Giao thức nào là giao thức đẩy?', ['HTTP', 'SMTP', 'POP3', 'IMAP'], 'B', 'SMTP đẩy; POP3, IMAP, HTTP kéo.'],
  [2, 'Cổng mặc định của IMAP:', ['110', '143', '25', '993'], 'B', 'IMAP: 143 (POP3: 110, SMTP: 25).'],
  [2, 'Bản ghi (www.abc.com, srv1.abc.com, CNAME) cho biết:', ['IP của www.abc.com là srv1.abc.com', 'www.abc.com là bí danh của srv1.abc.com', 'srv1.abc.com là mail server của abc.com', 'srv1.abc.com là DNS server của abc.com'], 'B', 'CNAME: tên bí danh → tên thật.'],
  [2, 'Để tìm mail server của miền abc.com, local DNS tra bản ghi loại:', ['A', 'NS', 'MX', 'CNAME'], 'C', 'MX cho biết tên mail server của miền.'],
  [2, 'DNS chủ yếu dùng giao thức và cổng:', ['TCP 53', 'UDP 53', 'UDP 67', 'TCP 80'], 'B', 'DNS chủ yếu dùng UDP cổng 53.'],
  [2, 'Trong truy vấn tuần tự, ai gửi truy vấn tới TLD server?', ['Host', 'Root server', 'Local DNS server', 'Authoritative server'], 'C', 'Trong truy vấn tuần tự, local DNS tự đi hỏi root, TLD, authoritative.'],
  [2, 'Phân phối file F cho N client theo client–server, server upload $u_s$. Một cận dưới của thời gian là:', ['$F/u_s$', '$NF/u_s$', '$F/(N u_s)$', '$N u_s/F$'], 'B', 'Server phải gửi N bản: $NF/u_s$.'],
  [2, 'Web server cổng 80 đang có 8 kết nối TCP. Số socket TCP đang dùng:', ['1', '8', '9', '16'], 'C', '1 socket chào đón + 8 socket kết nối = 9.'],
  [3, 'UDP phân kênh dựa vào:', ['IP nguồn và cổng nguồn', 'IP đích và cổng đích', 'Bộ 4 (IP, cổng của cả hai bên)', 'Số thứ tự'], 'B', 'UDP chỉ dùng (IP đích, cổng đích).'],
  [3, 'Gói UDP có trường Length = 500. Payload dài:', ['500 byte', '492 byte', '480 byte', '508 byte'], 'B', '$500 - 8 = 492$ byte (header UDP 8 byte).'],
  [3, 'Checksum của 10000000 00000001 và 10000000 00000010 là:', ['00000000 00000011', '11111111 11111011', '11111111 11111100', '00000000 00000100'], 'B', '8001 + 8002 = 1 0003, cộng vòng được 00000000 00000100, lấy bù: 11111111 11111011. A là tổng chưa cộng vòng; C là quên cộng 1 khi cộng vòng.'],
  [3, 'rdt2.1 thêm gì so với rdt2.0?', ['Timer', 'Số thứ tự', 'NAK', 'Checksum'], 'B', 'rdt2.1 thêm số thứ tự để xử lý ACK/NAK bị lỗi.'],
  [3, 'rdt3.0 xử lý mất gói bằng:', ['NAK', 'ACK trùng', 'Timer và gửi lại', 'Checksum'], 'C', 'rdt3.0 thêm timer.'],
  [3, 'Stop-and-wait với $L/R = 2$ ms, RTT = 18 ms. Hiệu suất:', ['0.1', '0.11', '0.9', '1'], 'A', '$U = \\frac{2}{18 + 2} = 0.1$.'],
  [3, 'Với số thứ tự 3 bit, cửa sổ lớn nhất của Selective Repeat:', ['3', '4', '7', '8'], 'B', 'SR: $N \\le 2^{3-1} = 4$.'],
  [3, 'GBN, cửa sổ 4, gửi pkt0–pkt3, pkt1 mất. Khi timeout, bên gửi gửi lại:', ['Chỉ pkt1', 'pkt1, pkt2, pkt3', 'pkt0–pkt3', 'Không gửi gì'], 'B', 'GBN gửi lại gói lỗi và mọi gói sau: pkt1, pkt2, pkt3.'],
  [3, 'Host A gửi segment Seq = 300 mang 200 byte. B nhận đủ mọi thứ trước đó. ACK của B là:', ['300', '301', '500', '501'], 'C', '$300 + 200 = 500$.'],
  [3, 'TCP gửi lại nhanh (fast retransmit) khi:', ['Nhận 1 ACK trùng', 'Nhận 3 ACK trùng', 'Timer hết hạn', 'rwnd bằng 0'], 'B', '3 ACK trùng kích hoạt fast retransmit.'],
  [3, 'EstimatedRTT = 80 ms, SampleRTT mới = 120 ms, $\\alpha = 0.125$. EstimatedRTT mới:', ['85 ms', '100 ms', '115 ms', '90 ms'], 'A', '$0.875 \\times 80 + 0.125 \\times 120 = 70 + 15 = 85$ ms.'],
  [3, 'Cờ nào dùng để yêu cầu đóng kết nối TCP?', ['SYN', 'RST', 'FIN', 'PSH'], 'C', 'FIN yêu cầu đóng; RST hủy kết nối khi có lỗi.'],
  [3, 'Đang ở tránh tắc nghẽn với cwnd = 16 MSS thì xảy ra timeout. Giá trị mới:', ['ssthresh = 8, cwnd = 1', 'ssthresh = 8, cwnd = 8', 'ssthresh = 16, cwnd = 1', 'ssthresh = 8, cwnd = 11'], 'A', 'Timeout: ssthresh = cwnd/2 = 8, cwnd = 1.'],
  [3, 'Phát biểu đúng về slow start:', ['cwnd tăng 1 MSS mỗi RTT', 'cwnd tăng gấp đôi mỗi RTT', 'cwnd giảm một nửa mỗi RTT', 'cwnd giữ nguyên'], 'B', 'Slow start nhân đôi cwnd mỗi RTT.'],
  [3, 'RcvBuffer = 8000 byte, LastByteRcvd = 6000, LastByteRead = 2500. rwnd bằng:', ['2000', '3500', '4500', '5500'], 'C', '$8000 - (6000 - 2500) = 4500$.'],
  [3, 'QUIC chạy trên giao thức vận chuyển nào?', ['TCP', 'UDP', 'SCTP', 'Trực tiếp trên IP'], 'B', 'QUIC chạy trên UDP.'],
];

export const QUIZ: QuizQ[] = raw.map(([chapter, q, options, ans, why], i) => ({ n: i + 1, chapter, q, options, answer: L(ans), why }));

export const QUIZ_MINUTES = 60;
