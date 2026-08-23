-- Deterministic Seeds for vlxd (Mock/Development data only - No production secrets)

-- 1. Standard Role Groups
INSERT INTO role_groups (id, code, name, description, is_system)
VALUES 
    ('00000000-0000-4000-8000-000000000001', 'SUPER_ADMIN', 'Super Admin', 'Chủ cửa hàng/công ty - toàn quyền hệ thống và tenant', TRUE),
    ('00000000-0000-4000-8000-000000000002', 'SYSTEM_ADMIN', 'System Admin', 'Quản trị hệ thống, quản lý tài khoản và phân quyền tenant', TRUE),
    ('00000000-0000-4000-8000-000000000003', 'SUPPORT_ADMIN', 'Support Admin', 'Quản lý vận hành nghiệp vụ, kế toán, thống kê và báo cáo', TRUE),
    ('00000000-0000-4000-8000-000000000004', 'USER', 'User', 'Nhân viên thao tác tác vụ hằng ngày (bán hàng, kho, giao hàng)', TRUE)
ON CONFLICT (code) DO NOTHING;

-- 2. Standard Core Permissions Catalog
INSERT INTO permissions (id, code, module, resource, action, name, description)
VALUES
    -- Auth & Account
    ('00000000-0000-4000-8001-000000000001', 'auth.session.read', 'auth', 'session', 'read', 'Xem phiên đăng nhập', 'Xem lịch sử và phiên đăng nhập hiện hành'),
    ('00000000-0000-4000-8001-000000000002', 'auth.session.revoke', 'auth', 'session', 'revoke', 'Thu hồi phiên đăng nhập', 'Đăng xuất từ xa các phiên làm việc'),
    ('00000000-0000-4000-8001-000000000003', 'user.account.read', 'user', 'account', 'read', 'Xem tài khoản người dùng', 'Xem danh sách nhân sự trong tenant'),
    ('00000000-0000-4000-8001-000000000004', 'user.account.create', 'user', 'account', 'create', 'Thêm người dùng', 'Mời hoặc thêm tài khoản nhân sự mới'),
    ('00000000-0000-4000-8001-000000000005', 'user.account.update', 'user', 'account', 'update', 'Sửa người dùng', 'Cập nhật thông tin nhân viên'),
    ('00000000-0000-4000-8001-000000000006', 'user.role.assign', 'user', 'role', 'assign', 'Phân quyền nhân sự', 'Gán chức danh và phân quyền cho nhân viên'),
    
    -- Products
    ('00000000-0000-4000-8001-000000000010', 'product.item.read', 'product', 'item', 'read', 'Xem sản phẩm', 'Xem danh mục vật liệu và giá bán'),
    ('00000000-0000-4000-8001-000000000011', 'product.item.create', 'product', 'item', 'create', 'Tạo sản phẩm', 'Thêm mới mặt hàng vật liệu'),
    ('00000000-0000-4000-8001-000000000012', 'product.item.update', 'product', 'item', 'update', 'Sửa sản phẩm', 'Cập nhật giá, quy cách, đơn vị tính'),
    ('00000000-0000-4000-8001-000000000013', 'product.item.archive', 'product', 'item', 'archive', 'Lưu trữ sản phẩm', 'Ẩn sản phẩm không còn kinh doanh'),

    -- Warehouse & Inventory
    ('00000000-0000-4000-8001-000000000020', 'warehouse.location.read', 'warehouse', 'location', 'read', 'Xem kho', 'Xem thông tin các nhà kho'),
    ('00000000-0000-4000-8001-000000000021', 'inventory.stock.read', 'inventory', 'stock', 'read', 'Xem tồn kho', 'Tra cứu số lượng tồn thực tế'),
    ('00000000-0000-4000-8001-000000000022', 'inventory.stock.import', 'inventory', 'stock', 'import', 'Nhập kho', 'Tạo phiếu nhập kho hàng hóa'),
    ('00000000-0000-4000-8001-000000000023', 'inventory.stock.export', 'inventory', 'stock', 'export', 'Xuất kho', 'Tạo phiếu xuất kho giao hàng'),
    ('00000000-0000-4000-8001-000000000024', 'inventory.stock.transfer', 'inventory', 'stock', 'transfer', 'Chuyển kho', 'Điều chuyển vật liệu giữa các kho'),
    ('00000000-0000-4000-8001-000000000025', 'inventory.stock.adjust', 'inventory', 'stock', 'adjust', 'Điều chỉnh tồn', 'Cân đối tồn kho sau kiểm kê'),

    -- Sales & Orders
    ('00000000-0000-4000-8001-000000000030', 'sales.order.read', 'sales', 'order', 'read', 'Xem đơn hàng', 'Xem danh sách đơn đặt hàng và báo giá'),
    ('00000000-0000-4000-8001-000000000031', 'sales.order.create', 'sales', 'order', 'create', 'Tạo đơn hàng', 'Lập báo giá và đơn bán hàng'),
    ('00000000-0000-4000-8001-000000000032', 'sales.order.update', 'sales', 'order', 'update', 'Sửa đơn hàng', 'Chỉnh sửa đơn hàng trước khi xuất'),
    ('00000000-0000-4000-8001-000000000033', 'sales.order.cancel', 'sales', 'order', 'cancel', 'Hủy đơn hàng', 'Hủy bỏ đơn hàng'),

    -- Finance & Debt
    ('00000000-0000-4000-8001-000000000040', 'finance.payment.read', 'finance', 'payment', 'read', 'Xem thanh toán', 'Xem phiếu thu/chi và sổ quỹ'),
    ('00000000-0000-4000-8001-000000000041', 'finance.payment.create', 'finance', 'payment', 'create', 'Tạo phiếu thu/chi', 'Ghi nhận thanh toán'),
    ('00000000-0000-4000-8001-000000000042', 'finance.debt.read', 'finance', 'debt', 'read', 'Xem công nợ', 'Xem công nợ khách hàng và nhà cung cấp'),

    -- Reports & Audit
    ('00000000-0000-4000-8001-000000000050', 'report.revenue.read', 'report', 'revenue', 'read', 'Xem báo cáo doanh thu', 'Xem thống kê doanh thu bán hàng'),
    ('00000000-0000-4000-8001-000000000051', 'report.profit.read', 'report', 'profit', 'read', 'Xem báo cáo lợi nhuận', 'Xem phân tích lợi nhuận gộp và chi phí'),
    ('00000000-0000-4000-8001-000000000052', 'audit.log.read', 'audit', 'log', 'read', 'Xem nhật ký kiểm toán', 'Tra cứu vết thao tác hệ thống'),
    ('00000000-0000-4000-8001-000000000053', 'audit.log.export', 'audit', 'log', 'export', 'Xuất báo cáo kiểm toán', 'Xuất file dữ liệu kiểm toán')
ON CONFLICT (code) DO NOTHING;

-- 3. Standard Titles
INSERT INTO titles (id, tenant_id, code, name, role_group_id, description)
VALUES
    ('00000000-0000-4000-8002-000000000001', NULL, 'CHU_CUA_HANG', 'Chủ cửa hàng / Giám đốc', '00000000-0000-4000-8000-000000000001', 'Quyết định cao nhất toàn bộ hoạt động kinh doanh'),
    ('00000000-0000-4000-8002-000000000002', NULL, 'QUAN_TRI_HE_THONG', 'Quản trị hệ thống', '00000000-0000-4000-8000-000000000002', 'Cấu hình hệ thống, quản lý người dùng và gán quyền'),
    ('00000000-0000-4000-8002-000000000003', NULL, 'QUAN_LY_CUA_HANG', 'Quản lý cửa hàng', '00000000-0000-4000-8000-000000000003', 'Điều phối kinh doanh, duyệt chiết khấu và theo dõi vận hành'),
    ('00000000-0000-4000-8002-000000000004', NULL, 'KE_TOAN', 'Kế toán', '00000000-0000-4000-8000-000000000003', 'Theo dõi công nợ, thu chi, hóa đơn và sổ sách tài chính'),
    ('00000000-0000-4000-8002-000000000005', NULL, 'THU_KHO', 'Thủ kho', '00000000-0000-4000-8000-000000000004', 'Quản lý nhập xuất chuyển kho và kiểm đếm vật liệu'),
    ('00000000-0000-4000-8002-000000000006', NULL, 'NHAN_VIEN_BAN_HANG', 'Nhân viên bán hàng', '00000000-0000-4000-8000-000000000004', 'Tư vấn, báo giá và lập đơn hàng cho khách')
ON CONFLICT DO NOTHING;

-- 4. Sample Mock Tenants
INSERT INTO tenants (id, code, name, tax_code, phone, email, address, status, settings)
VALUES
    ('00000000-0000-4000-a000-000000000001', 'vlxd-hungphat', 'Công ty VLXD Hưng Phát', '0312345678', '0901234567', 'contact@hungphat-vlxd.vn', '123 Quốc lộ 1A, TP. Thủ Đức, TP.HCM', 'ACTIVE', '{"currency":"VND","timezone":"Asia/Ho_Chi_Minh"}'),
    ('00000000-0000-4000-a000-000000000002', 'vlxd-angia', 'Cửa hàng VLXD An Gia', '0387654321', '0918765432', 'angia.vlxd@example.com', '456 Hương Lộ 2, Bình Chánh, TP.HCM', 'ACTIVE', '{"currency":"VND","timezone":"Asia/Ho_Chi_Minh"}')
ON CONFLICT (code) DO NOTHING;

-- 5. Sample Mock Users (Fake mock password hash for dev/test only)
INSERT INTO users (id, email, phone, full_name, password_hash, status)
VALUES
    ('00000000-0000-4000-b000-000000000001', 'owner.hungphat@example.com', '0901234567', 'Nguyễn Văn Hưng', '$2a$10$mockpasswordhashhungphatowner000000000000000000000000000', 'ACTIVE'),
    ('00000000-0000-4000-b000-000000000002', 'sales.hungphat@example.com', '0909876543', 'Trần Thị Mai', '$2a$10$mockpasswordhashhungphatsales000000000000000000000000000', 'ACTIVE'),
    ('00000000-0000-4000-b000-000000000003', 'owner.angia@example.com', '0918765432', 'Lê Hoàng An', '$2a$10$mockpasswordhashangiaowner000000000000000000000000000000', 'ACTIVE')
ON CONFLICT (email) DO NOTHING;

-- 6. Sample Tenant Users
INSERT INTO tenant_users (id, tenant_id, user_id, status, is_owner)
VALUES
    ('00000000-0000-4000-c000-000000000001', '00000000-0000-4000-a000-000000000001', '00000000-0000-4000-b000-000000000001', 'ACTIVE', TRUE),
    ('00000000-0000-4000-c000-000000000002', '00000000-0000-4000-a000-000000000001', '00000000-0000-4000-b000-000000000002', 'ACTIVE', FALSE),
    ('00000000-0000-4000-c000-000000000003', '00000000-0000-4000-a000-000000000002', '00000000-0000-4000-b000-000000000003', 'ACTIVE', TRUE)
ON CONFLICT (tenant_id, user_id) DO NOTHING;

-- 7. Sample Tenant Plans
INSERT INTO tenant_plans (id, tenant_id, plan_code, status, max_products, max_warehouses, features, started_at)
VALUES
    ('00000000-0000-4000-d000-000000000001', '00000000-0000-4000-a000-000000000001', 'STANDARD', 'ACTIVE', 800, 1, '{"hasAIAgent":false,"hasVoice":false,"hasInvoiceOCR":false,"databaseMode":"shared"}', timezone('utc'::text, now())),
    ('00000000-0000-4000-d000-000000000002', '00000000-0000-4000-a000-000000000002', 'FREE', 'ACTIVE', 80, 1, '{"hasAIAgent":false,"hasVoice":false,"hasInvoiceOCR":false,"databaseMode":"shared"}', timezone('utc'::text, now()))
ON CONFLICT DO NOTHING;
