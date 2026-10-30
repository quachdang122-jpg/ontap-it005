/** Các hộp “Bẫy hay gặp” trong tài liệu IT005, gom theo chủ đề. */
export interface Trap {
  topic: string;
  section: string;
  problem?: string;
  text: string;
}

export const TRAPS: Trap[] = [
  // Đơn vị và làm tròn
  { topic: 'Đơn vị và làm tròn', section: '1.4', problem: 'one-hop-delay', text: 'Quên nhân 8 khi L cho bằng byte (lỗi phổ biến nhất).' },
  { topic: 'Đơn vị và làm tròn', section: '1.4', problem: 'one-hop-delay', text: '1 Mbps = $10^6$ bps, không phải $2^{20}$.' },
  { topic: 'Đơn vị và làm tròn', section: '1.4', problem: 'one-hop-delay', text: 'Trang bài tập thường yêu cầu đáp án theo ms hoặc giây: đọc kỹ đơn vị trước khi nhập.' },
  { topic: 'Đơn vị và làm tròn', section: '2.8', problem: 'p2p', text: 'F hay cho bằng Gbit nhưng có đề cho bằng GB: phải nhân 8.' },
  { topic: 'Đơn vị và làm tròn', section: '1.2', problem: 'ps-vs-cs', text: 'Trang bài tập thường yêu cầu làm tròn tới vài chữ số có nghĩa; dùng máy tính có hàm tổ hợp $\\binom{N}{n}$.' },
  // Trễ và thông lượng
  { topic: 'Trễ và thông lượng', section: '1.1', problem: 'circuit-switching', text: 'Với kết nối A–C, đừng cộng kênh của cả 4 link. Mỗi đường bị chặn bởi link yếu nhất của nó (giống thông lượng = min).' },
  { topic: 'Trễ và thông lượng', section: '1.2', problem: 'ps-vs-cs', text: '“Hơn 10 người” nghĩa là từ 11 trở lên. Tổng $\\sum$ phải chạy từ 0 tới 10 (bao gồm cả 10).' },
  { topic: 'Trễ và thông lượng', section: '1.3', problem: 'caravan', text: 'Thời gian từ lúc xe đầu rời trạm 1 tới lúc được phục vụ ở trạm 2: nhiều bạn chỉ lấy thời gian chạy. Sai vì quên điều kiện “phải đủ đoàn”: xe đầu tới nơi nhưng phải chờ xe cuối.' },
  { topic: 'Trễ và thông lượng', section: '1.5', problem: 'queuing-delay', text: 'Câu hỏi “trong thực tế, trễ hàng đợi có thay đổi nhiều không?”: có, công thức chỉ cho giá trị trung bình xấp xỉ.' },
  { topic: 'Trễ và thông lượng', section: '1.5', problem: 'queuing-delay', text: 'Công thức trên trang viết “IL/R(1 − I)” nghĩa là $\\frac{IL}{R(1-I)}$: thừa số $(1 - I)$ nằm dưới mẫu.' },
  { topic: 'Trễ và thông lượng', section: '1.6', problem: 'end-to-end-delay', text: 'Phương án nhiễu thường là chỉ tổng trễ truyền hoặc chỉ tổng trễ lan truyền (câu 14 đề 2020, câu 12 mã đề 2).' },
  { topic: 'Trễ và thông lượng', section: '1.6', problem: 'end-to-end-delay', text: 'Link có tốc độ cao nhất không làm giảm trễ lan truyền: link dài vẫn chiếm phần lớn tổng trễ.' },
  // Phân tầng
  { topic: 'Phân tầng', section: '1.8', problem: 'layering', text: 'Router chỉ xử lý 3 tầng dưới (Network, Link, Physical); switch chỉ xử lý 2 tầng (Link, Physical); host xử lý đủ 5 tầng.' },
  { topic: 'Phân tầng', section: '1.8', problem: 'layering', text: 'Physical không có header. Application là phần dữ liệu M, không phải header (theo cách đếm của bài này).' },
  // DNS và HTTP
  { topic: 'DNS và HTTP', section: '2.1', problem: 'dns-cache', text: 'Bộ nhớ đệm có lợi cho người khác là cache của local DNS và web proxy (dùng chung). Cache của trình duyệt chỉ có lợi cho chính người dùng đó.' },
  { topic: 'DNS và HTTP', section: '2.1', problem: 'dns-cache', text: 'Bản ghi A chứa tên host và địa chỉ IPv4 (kèm TTL).' },
  { topic: 'DNS và HTTP', section: '2.2', problem: 'dns-iter-rec', text: 'Đệ quy có thể nhanh hơn khi các server “gần nhau”, nhưng root và TLD không làm đệ quy trong thực tế vì sẽ quá tải.' },
  { topic: 'DNS và HTTP', section: '2.3', problem: 'dns-http-delay', text: 'Trang gốc luôn tốn 2RTT kể cả với HTTP bền vững, vì lần đầu vẫn phải bắt tay TCP.' },
  { topic: 'DNS và HTTP', section: '2.3', problem: 'dns-http-delay', text: 'Đọc kỹ đề: các RTT DNS cho riêng từng server và phải cộng hết (local, rồi các server khác).' },
  { topic: 'DNS và HTTP', section: '2.4', problem: 'http-request', text: 'Không ghi q nghĩa là q = 1. Địa chỉ IP của máy khách không nằm trong thông điệp HTTP (nằm ở header IP).' },
  { topic: 'DNS và HTTP', section: '2.8', problem: 'p2p', text: 'Ở P2P, server chỉ cần gửi ít nhất một bản ($F/u_s$), không phải N bản.' },
  // Truyền tin cậy
  { topic: 'Checksum và truyền tin cậy', section: '3.2', problem: 'checksum', text: 'Phương án nhiễu kinh điển: quên cộng vòng hoặc quên lấy bù (câu 21 mã đề 2, câu 26 đề 2020).' },
  { topic: 'Checksum và truyền tin cậy', section: '3.2', problem: 'checksum', text: 'Đảo 1 bit ở một từ: checksum luôn đổi, nên lỗi luôn bị phát hiện. Đảo cùng vị trí bit ở hai từ theo hai chiều ngược nhau: tổng không đổi, lỗi không bị phát hiện.' },
  { topic: 'Checksum và truyền tin cậy', section: '3.2', problem: 'checksum', text: 'Checksum UDP được tính trên pseudo-header (IP nguồn, IP đích, giao thức, độ dài), header UDP và dữ liệu.' },
  // TCP
  { topic: 'TCP', section: '3.6', problem: 'tcp-seq-ack', text: 'Có lượt giả định “bên nhận bỏ segment sai thứ tự” (giống GBN). Khi đó sau khi gửi lại, ACK chỉ tăng thêm một segment và các segment sau phải gửi lại. Đọc kỹ giả định trong đề.' },
  { topic: 'TCP', section: '3.6', problem: 'tcp-seq-ack', text: 'Mất ACK thì thường không sao: ACK sau là ACK tích lũy, xác nhận luôn phần trước.' },
  { topic: 'TCP', section: '3.7', problem: 'tcp-rtt', text: 'Đề thi hay đổi $\\alpha$ (ví dụ $\\alpha = 0.2$ ở câu 23 đề 2020). Nhớ: $\\alpha$ nhân với mẫu mới.' },
  { topic: 'TCP', section: '3.7', problem: 'tcp-rtt', text: 'Không có giá trị ban đầu thì lấy mẫu đầu tiên làm EstimatedRTT.' },
  { topic: 'TCP', section: '3.7', problem: 'tcp-rtt', text: 'Một số tài liệu (RFC 6298) cập nhật DevRTT trước bằng EstimatedRTT cũ, nên kết quả hơi khác. Làm theo cách của đề/trang bài tập.' },
  { topic: 'TCP', section: '3.7', problem: 'tcp-rtt', text: 'EstimatedRTT là trung bình có trọng số, nên phụ thuộc vào mọi mẫu trước đó, không chỉ mẫu gần nhất.' },
  { topic: 'TCP', section: '3.9', problem: 'cwnd', text: 'Vòng mà cwnd vừa bằng ssthresh bắt đầu tăng tuyến tính. Một số đáp án vẫn tính vòng đó vào slow start; xem quy ước của đề.' },
  { topic: 'TCP', section: '3.9', problem: 'cwnd', text: 'Sau 3 ACK trùng, có tài liệu cho cwnd = ssthresh (bỏ +3). Slide của lớp dùng ssthresh + 3 trong fast recovery.' },
];

export const TOPICS = [...new Set(TRAPS.map((t) => t.topic))];
