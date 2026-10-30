/** Knowledge check theo mục, lấy từ các bảng Knowledge check trong tài liệu IT005. */
export interface Card {
  id: string;
  section: string;
  q: string;
  a: string;
}

const raw: [string, string, string][] = [
  // Chương 1
  ['1.1', 'Internet theo góc nhìn “phần cứng, phần mềm” gồm những gì?', 'Hàng tỷ thiết bị đầu cuối (host), link truyền thông, bộ chuyển mạch gói (router, switch), cùng các giao thức điều khiển việc gửi nhận.'],
  ['1.1', 'Internet theo góc nhìn “dịch vụ”?', 'Hạ tầng cung cấp dịch vụ cho các ứng dụng phân tán (web, email, streaming…) qua giao diện lập trình (socket).'],
  ['1.1', 'Giao thức là gì?', 'Quy định định dạng, thứ tự các thông điệp trao đổi, và hành động khi gửi hoặc nhận thông điệp.'],
  ['1.1', 'Tình huống nào giữa người với người là một “giao thức”?', 'Tình huống có trao đổi thông điệp theo thứ tự và phản hồi xác định (hỏi giờ, rồi được trả lời). Một người đi bộ một mình không phải giao thức.'],
  ['1.2', 'Công nghệ truyền nào có tốc độ cao nhất và tỷ lệ lỗi bit thấp nhất?', 'Cáp quang: truyền bằng xung ánh sáng, suy hao thấp, miễn nhiễm nhiễu điện từ.'],
  ['1.2', 'Ghép công nghệ truy cập với tốc độ điển hình.', 'DSL: vài chục Mbps xuống; cáp, FTTH: hàng chục tới hàng trăm Mbps; WiFi, 4G/5G: hàng chục tới hàng trăm Mbps mỗi thiết bị; link lõi: hàng trăm Gbps tới Tbps.'],
  ['1.3', 'Phân biệt định tuyến (routing) và chuyển tiếp (forwarding).', 'Routing: toàn mạng, tìm đường đi nguồn–đích (thuật toán định tuyến). Forwarding: cục bộ ở một router, chuyển gói từ cổng vào ra cổng ra theo bảng.'],
  ['1.3', 'Đặc điểm của chuyển mạch gói?', 'Không thiết lập trước; lưu và chuyển; dùng chung tài nguyên theo nhu cầu; có thể có trễ hàng đợi và mất gói khi tắc nghẽn.'],
  ['1.3', 'Đặc điểm của chuyển mạch kênh?', 'Phải thiết lập kết nối; tài nguyên dành riêng (FDM/TDM); tốc độ đảm bảo; tài nguyên bỏ phí khi không dùng.'],
  ['1.3', '“Internet là mạng của các mạng” nghĩa là gì?', 'Internet gồm nhiều mạng (ISP các cấp, IXP, mạng nội dung) do các tổ chức khác nhau quản lý, nối với nhau; không ai điều khiển toàn bộ.'],
  ['1.3', '5 người dùng chung link 10 Mbps: khi nào chuyển mạch kênh hợp, khi nào chuyển mạch gói hợp?', 'Mỗi người cần đều đặn 2 Mbps: chuyển mạch kênh. Lưu lượng bùng nổ, ít khi dùng: chuyển mạch gói. Tổng nhu cầu luôn vượt xa 10 Mbps: cả hai đều không ổn.'],
  ['1.4', 'Ghép 4 loại trễ với mô tả.', 'Xử lý: kiểm tra header, chọn cổng ra. Hàng đợi: chờ trong buffer. Truyền: đẩy hết các bit ra link ($L/R$). Lan truyền: bit đi hết chiều dài link ($d/s$).'],
  ['1.4', 'Trễ truyền gói 1500 byte trên link 1 Gbps?', '$\\frac{1500 \\times 8}{10^9} = 12\\,\\mu\\text{s}$.'],
  ['1.4', 'Trễ truyền gói 1200 byte trên link 100 Mbps?', '$\\frac{1200 \\times 8}{10^8} = 96\\,\\mu\\text{s}$.'],
  ['1.5', 'Ghép tầng với đơn vị dữ liệu.', 'Application: message; Transport: segment; Network: datagram; Link: frame; Physical: bit.'],
  ['1.5', 'Đóng gói (encapsulation) là gì?', 'Mỗi tầng nhận dữ liệu từ tầng trên, thêm header của mình rồi chuyển xuống tầng dưới.'],
  // Chương 2
  ['2.1', 'Đặc điểm của kiến trúc client–server?', 'Server luôn bật, địa chỉ IP cố định; client chủ động liên lạc server; các client không liên lạc trực tiếp với nhau.'],
  ['2.1', 'Đặc điểm của P2P?', 'Các peer liên lạc trực tiếp; peer kết nối không liên tục, có thể đổi IP; không cần server luôn bật; tự mở rộng (thêm peer thì thêm năng lực).'],
  ['2.1', 'UDP cung cấp dịch vụ gì cho ứng dụng?', 'Chỉ phân kênh theo cổng và kiểm tra lỗi bằng checksum. Không tin cậy, không điều khiển luồng hay tắc nghẽn, không bắt tay.'],
  ['2.1', 'TCP cung cấp dịch vụ gì?', 'Truyền tin cậy, đúng thứ tự (dòng byte), điều khiển luồng, điều khiển tắc nghẽn, hướng kết nối. Không đảm bảo thời gian, thông lượng tối thiểu.'],
  ['2.2', '“HTTP không trạng thái” nghĩa là gì?', 'Server không nhớ gì về các request trước của client; mỗi request được xử lý độc lập.'],
  ['2.2', 'Cookie dùng để làm gì?', 'Giữ trạng thái qua nhiều request: nhận diện người dùng, giỏ hàng, phiên đăng nhập, cá nhân hóa.'],
  ['2.2', 'Mục đích của GET có điều kiện?', 'Chỉ tải đối tượng nếu đã thay đổi kể từ thời điểm cho trước; nếu chưa đổi server trả 304 không kèm dữ liệu, tiết kiệm băng thông.'],
  ['2.2', 'Lợi ích của web cache?', 'Giảm thời gian phản hồi; giảm lưu lượng trên link truy cập của tổ chức; giảm tải cho server gốc.'],
  ['2.2', 'HTTP/2 thay đổi gì so với HTTP/1.1?', 'Đóng khung nhị phân, chia đối tượng thành frame và xen kẽ nhiều luồng trên một kết nối (giảm HOL blocking), nén header, server push. Các phương thức GET, POST… giữ nguyên.'],
  ['2.2', 'Response có “Connection: Close”: server có đóng kết nối không?', 'Có, sau khi gửi xong response này.'],
  ['2.3', 'Ghép chức năng với SMTP hoặc IMAP.', 'SMTP: gửi thư từ UA tới server và giữa các server. IMAP: lấy thư, quản lý thư mục, đánh dấu trên server.'],
  ['2.3', 'So sánh HTTP và SMTP.', 'Chỉ HTTP: kéo; mỗi đối tượng trong một response riêng. Chỉ SMTP: đẩy; nội dung ASCII 7 bit; nhiều đối tượng gửi chung một thông điệp; kết thúc thư bằng dòng chỉ có dấu chấm. Cả hai: chạy trên TCP; lệnh và mã trạng thái dạng văn bản; kiến trúc client–server.'],
  ['2.4', 'Vì sao DNS dùng bộ nhớ đệm?', 'Giảm thời gian phân giải và giảm lưu lượng tới root/TLD.'],
  ['2.4', 'Vai trò của authoritative server?', 'Giữ bản ghi chính thức của các host trong miền của tổ chức, trả lời cuối cùng cho truy vấn về các host đó.'],
  ['2.4', 'Phát biểu đúng về local DNS?', 'Không thuộc phân cấp; gần host (ở ISP, trường); làm proxy chuyển truy vấn vào phân cấp; lưu đệm câu trả lời cho nhiều host.'],
  ['2.4', 'Bộ nhớ đệm nào có lợi cho cả người khác, không chỉ người dùng đó?', 'Cache của local DNS và web proxy (dùng chung). Cache của trình duyệt chỉ có lợi cho chính người dùng đó.'],
  ['2.7', 'Socket UDP khác socket TCP thế nào khi gửi dữ liệu?', 'UDP không kết nối, không bắt tay; mỗi gói gửi đi phải ghi rõ IP và cổng đích. Server trả lời bằng cách đọc IP và cổng nguồn của gói nhận được.'],
  ['2.7', 'Client TCP gọi connect() thì điều gì xảy ra?', 'Tầng vận chuyển bắt đầu bắt tay 3 bước (gửi SYN).'],
  ['2.7', 'Web server cổng 80 đang có 5 kết nối TCP dùng bao nhiêu socket TCP?', '$1 + 5 = 6$: một socket chào đón (listen/accept) và mỗi kết nối một socket riêng.'],
  // Chương 3
  ['3.1', 'Tầng vận chuyển chủ yếu được cài đặt ở đâu?', 'Ở các host (mạng biên), không phải router.'],
  ['3.1', 'Tầng vận chuyển cung cấp truyền giữa các host?', 'Sai: truyền giữa các tiến trình. Truyền giữa các host là việc của tầng mạng.'],
  ['3.1', 'Dịch vụ của TCP?', 'Tin cậy, đúng thứ tự, dòng byte (không giữ ranh giới thông điệp), điều khiển luồng, điều khiển tắc nghẽn. Không đảm bảo thông lượng hay độ trễ.'],
  ['3.1', 'Dịch vụ của UDP?', 'Chỉ giữ ranh giới thông điệp (mỗi lần gửi là một datagram). Không tin cậy, không thứ tự, không điều khiển luồng hay tắc nghẽn.'],
  ['3.1', 'IP “best effort” nghĩa là?', 'Cố gắng chuyển nhưng không đảm bảo tới nơi, đúng thứ tự hay nguyên vẹn.'],
  ['3.2', 'Phân kênh (demultiplexing) là gì?', 'Ở bên nhận: đưa segment tới đúng socket dựa vào các trường cổng (và IP).'],
  ['3.2', 'Ghép kênh (multiplexing) là gì?', 'Ở bên gửi: gom dữ liệu từ nhiều socket, thêm header (cổng) rồi chuyển xuống tầng mạng.'],
  ['3.2', 'Nhiều client UDP gửi tới cùng cổng đích thì luôn vào cùng một socket?', 'Đúng: UDP phân kênh theo (IP đích, cổng đích).'],
  ['3.2', 'Nhiều client TCP gửi tới cùng cổng đích thì luôn vào cùng một socket?', 'Sai: mỗi kết nối một socket (phân kênh theo bộ 4).'],
  ['3.3', 'UDP có giữ ranh giới thông điệp không?', 'Có: mỗi lần ghi của ứng dụng thành một datagram và được giao nguyên vẹn.'],
  ['3.3', 'Các trường của header UDP?', 'Cổng nguồn, cổng đích, độ dài, checksum; mỗi trường 16 bit, tổng 8 byte.'],
  ['3.3', 'Vì sao cần trường độ dài?', 'Để biết segment (header + dữ liệu) dài bao nhiêu, vì dữ liệu có độ dài thay đổi.'],
  ['3.4', 'Vì sao GBN bỏ gói sai thứ tự?', 'Bên nhận không cần bộ đệm, đơn giản hơn; đằng nào bên gửi cũng gửi lại từ gói lỗi.'],
  ['3.4', 'Vì sao giữ lại gói sai thứ tự thì tốt hơn?', 'Tránh gửi lại những gói đã tới, tiết kiệm băng thông (cách của SR).'],
  ['3.4', 'Vì sao SR phải ACK cả gói nằm bên trái cửa sổ nhận?', 'Có thể ACK trước đó bị mất, bên gửi gửi lại; nếu bên nhận im lặng thì cửa sổ bên gửi không bao giờ trượt.'],
  ['3.4', 'Hiệu suất stop-and-wait với L = 10 Kbit, R = 10 Mbps, RTT = 10 ms?', '$L/R = 1$ ms nên $U = \\frac{1}{10 + 1} \\approx 9.1\\%$; gửi được 11 gói trước khi ACK đầu tiên về.'],
  ['3.5', 'TCP có giữ ranh giới thông điệp (mỗi lần ghi một segment)?', 'Không: TCP là dòng byte.'],
  ['3.5', 'Bên gửi nhận ACK 120 trong khi còn segment 92 chưa ACK…', 'Bên gửi khởi động lại timer cho segment chưa ACK cũ nhất.'],
  ['3.5', 'Giữ dữ liệu chưa ACK ≤ rwnd có đảm bảo không tràn buffer bên nhận?', 'Đúng.'],
  ['3.5', 'Ghép cờ với ý nghĩa.', 'SYN: yêu cầu kết nối; SYNACK: server đồng ý; FIN: bắt đầu đóng; ACK của FIN: xác nhận đóng; RST: lỗi khi thiết lập hoặc đóng kết nối.'],
  ['3.5', '3 ACK trùng luôn có nghĩa là mất gói?', 'Không hẳn: nếu kênh có thể đảo thứ tự gói thì 3 ACK trùng có thể xảy ra mà không mất gói.'],
  ['3.5', 'EstimatedRTT phụ thuộc vào những mẫu nào?', 'Mọi mẫu trước đó (trung bình có trọng số), không chỉ mẫu gần nhất.'],
  ['3.6', 'Hình nào minh họa điều khiển luồng, hình nào là tắc nghẽn?', 'Một bên gửi làm tràn một bên nhận (ly nước tràn): luồng. Nhiều bên tranh nhau tài nguyên chung (kẹt xe, đám đông): tắc nghẽn.'],
  ['3.6', '2 bên gửi, thông lượng hữu ích = 0.8 × tải gửi. Phần truyền lại?', '$1 - 0.8 = 0.2$.'],
  ['3.6', 'Điều khiển tắc nghẽn có hỗ trợ của mạng là gì?', 'Router báo trực tiếp: đánh dấu bit trong header (ECN) hoặc gửi thông điệp báo chậm lại.'],
  ['3.6', 'Điều khiển tắc nghẽn đầu cuối là gì?', 'Bên gửi tự suy ra tắc nghẽn từ mất gói (timeout, ACK trùng) hoặc từ RTT tăng.'],
  ['3.7', 'Phát biểu đúng về AIMD của TCP?', 'Giảm một nửa khi 3 ACK trùng; đầu cuối; dùng mất gói để phát hiện tắc nghẽn. (Timeout thì về 1, không phải giảm nửa.)'],
  ['3.7', 'Slow start tăng nhanh hay chậm hơn AIMD?', 'Nhanh hơn: tăng theo cấp số nhân mỗi RTT. Tên “slow” là vì bắt đầu từ 1.'],
  ['3.7', 'TCP CUBIC khi cwnd chưa tới Wmax?', 'Tăng nhanh khi còn xa Wmax, chậm lại khi tới gần Wmax.'],
  ['3.7', 'Điều khiển tắc nghẽn dựa trên độ trễ: thông lượng đo được gần bằng cwnd/RTTmin thì sao?', 'Tăng tốc độ gửi (chưa có hàng đợi). Nếu nhỏ hơn nhiều: giảm tốc độ (hàng đợi đang dài ra).'],
];

export const CARDS: Card[] = raw.map(([section, q, a], i) => ({ id: `kc${i}`, section, q, a }));

export const SECTIONS = [...new Set(CARDS.map((c) => c.section))];
