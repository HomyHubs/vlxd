# Role Management — vlxd

> Mục tiêu: thiết kế hệ thống role/user cho một cửa hàng vật liệu xây dựng thật, đủ chặt để kiểm soát tiền, hàng, người, quyền thao tác và audit. Đây là nền tảng cho permission matrix sau này.

## 1. Tư duy CEO

Một cửa hàng vật liệu xây dựng không chỉ cần “ai được đăng nhập”. Hệ thống phải kiểm soát các rủi ro kinh doanh chính:

1. **Mất hàng:** sửa tồn kho, xuất kho, điều chỉnh kiểm kho không kiểm soát.
2. **Mất tiền:** sửa giá, chiết khấu, công nợ, thanh toán, hủy hóa đơn tùy tiện.
3. **Sai đơn:** nhân viên tạo đơn vượt quyền, bán hàng không có tồn, giao sai kho.
4. **Lộ dữ liệu:** nhân viên xem báo cáo lợi nhuận, danh sách khách hàng lớn, công nợ nhạy cảm.
5. **Lạm quyền:** một người vừa tạo đơn, sửa giá, xác nhận xuất kho, ghi nhận thanh toán mà không có kiểm soát.
6. **Không truy vết:** không biết ai sửa/xóa/hủy chứng từ hoặc thay đổi quyền.

Vì vậy role management phải tách rõ:

- **Title:** chức danh ngoài đời.
- **Role group:** nhóm quyền hệ thống.
- **Permission/capability:** quyền chi tiết theo module và hành động.
- **Scope:** phạm vi quyền theo tenant, chi nhánh, kho, hoặc record.
- **Audit log:** nhật ký thao tác bắt buộc.

---

## 2. Khái niệm chuẩn

### 2.1 Title

Title là chức danh kinh doanh/nhân sự, dùng để hiển thị và gán role mặc định.

Ví dụ:

- Chủ cửa hàng / Giám đốc
- Quản lý cửa hàng
- Quản lý chi nhánh
- Quản trị hệ thống
- Kế toán
- Thủ kho
- Nhân viên kho
- Nhân viên bán hàng
- Thu ngân
- Nhân viên mua hàng
- Nhân viên giao hàng
- Chăm sóc khách hàng
- Kiểm soát nội bộ / Auditor

### 2.2 Role group

Role group là nhóm quyền hệ thống, dùng để gom title và áp permission mặc định.

Role group tạm thời:

1. **Super admin** — cao nhất.
2. **System admin** — quản trị hệ thống/user/quyền/record.
3. **Support admin** — quản lý nghiệp vụ, record, thống kê, báo cáo.
4. **User** — nhân viên thao tác nghiệp vụ hằng ngày.

### 2.3 Permission

Permission là quyền chi tiết dùng cho matrix sau này.

Mẫu đặt tên:

```text
<module>.<resource>.<action>
```

Ví dụ:

```text
sales.order.create
sales.order.read
sales.order.update
sales.order.cancel
inventory.stock_adjustment.approve
user.role.assign
report.profit.view
```

### 2.4 Scope

Scope giới hạn quyền theo phạm vi:

| Scope | Ý nghĩa |
| --- | --- |
| tenant | Toàn công ty/cửa hàng |
| branch | Một chi nhánh |
| warehouse | Một hoặc nhiều kho |
| own_records | Chỉ record do user tạo/phụ trách |
| assigned_records | Record được phân công |
| read_only | Chỉ xem |

---

## 3. Role group chuẩn

| Role group | Mục đích | Quyền mặc định | Không nên có quyền |
| --- | --- | --- | --- |
| Super admin | Chủ cửa hàng/công ty, người chịu trách nhiệm cuối cùng | Toàn quyền tenant, billing/plan, cấu hình, phân quyền cấp cao, xem mọi báo cáo | Không nên dùng cho thao tác bán hàng hằng ngày nếu không cần |
| System admin | Quản trị vận hành hệ thống | Quản lý user, title, role, cấu hình, danh mục, thêm/sửa/xem record | Không tự ý đổi billing/plan nếu không được cấp |
| Support admin | Quản lý nghiệp vụ | Thêm/sửa/xem record, xử lý sai lệch, xem thống kê/báo cáo, hỗ trợ kho/bán hàng/kế toán | Không toàn quyền phân quyền cấp cao, không billing |
| User | Nhân viên thao tác hằng ngày | Tạo đơn, xem record được phân quyền, xem tồn kho, cập nhật tác vụ được giao | Không quản lý user/quyền, không xem báo cáo nhạy cảm mặc định |

---

## 4. Title đề xuất cho cửa hàng vật liệu xây dựng

| Title | Role group mặc định | Trách nhiệm chính | Ghi chú quyền |
| --- | --- | --- | --- |
| Chủ cửa hàng / Giám đốc | Super admin | Quyết định kinh doanh, tài chính, nhân sự, gói dịch vụ, dữ liệu | Có quyền cao nhất; nên bật xác thực mạnh |
| Quản trị hệ thống | System admin | Tạo user, khóa/mở user, gán title/role, cấu hình tenant | Không nhất thiết xem lợi nhuận nếu chủ không cấp |
| Quản lý cửa hàng | Support admin | Điều phối bán hàng, kho, đơn hàng, nhân sự tại cửa hàng | Có thể xem báo cáo vận hành |
| Quản lý chi nhánh | Support admin | Quản lý một chi nhánh/kho cụ thể | Scope nên theo branch/warehouse |
| Nhân viên bán hàng | User | Tạo báo giá, đơn hàng, xem tồn kho, khách hàng | Không sửa giá dưới mức sàn nếu chưa được duyệt |
| Thu ngân | User | Ghi nhận thanh toán, in hóa đơn/phiếu thu | Không tự hủy thanh toán đã đối soát |
| Kế toán bán hàng | Support admin | Hóa đơn, thanh toán, công nợ khách hàng | Có quyền báo cáo tài chính vận hành |
| Kế toán công nợ | Support admin | Theo dõi nợ phải thu/phải trả, nhắc nợ | Hạn chế sửa đơn hàng gốc |
| Thủ kho | User | Nhập/xuất/chuyển kho, xác nhận giao nhận hàng | Có quyền kho nhưng không sửa giá bán |
| Nhân viên kho | User | Soạn hàng, kiểm hàng, cập nhật trạng thái kho | Scope theo warehouse |
| Nhân viên mua hàng | User | Tạo yêu cầu mua/đơn nhập, làm việc NCC | Không duyệt chi nếu chưa cấp |
| Nhân viên giao hàng | User | Xem đơn giao, cập nhật trạng thái giao, bằng chứng giao | Chỉ xem thông tin cần để giao |
| CSKH | User | Xem lịch sử mua, tiếp nhận yêu cầu đổi trả/khiếu nại | Không xem báo cáo lợi nhuận |
| Kiểm soát nội bộ / Auditor | Support admin | Xem audit log, báo cáo, kiểm tra sai lệch | Nên read-only hoặc quyền kiểm soát riêng |

---

## 5. User types cần có

### 5.1 Tenant owner

- Người sở hữu tenant/công ty.
- Thường là Chủ cửa hàng/Giám đốc.
- Có quyền chọn gói dịch vụ, billing, xóa/đóng tenant, gán Super admin khác.

### 5.2 Internal staff

- Nhân sự nội bộ cửa hàng.
- Có title, role group, scope và trạng thái làm việc.

### 5.3 External accountant / auditor

- Người ngoài được mời vào xem số liệu hoặc kiểm tra.
- Nên có quyền giới hạn theo thời gian và read-only mặc định.

### 5.4 Delivery partner / shipper

- Có thể là nhân viên nội bộ hoặc tài khoản giới hạn.
- Chỉ xem đơn cần giao, địa chỉ, số điện thoại cần thiết, trạng thái giao.

### 5.5 Support operator của nền tảng HomyHubs

- Nếu HomyHubs vận hành SaaS nhiều tenant, cần phân biệt với user của cửa hàng.
- Không được mặc định xem dữ liệu tenant nếu chưa có cơ chế impersonation/audit/consent.
- Nên thiết kế riêng sau: platform admin vs tenant admin.

---

## 6. Module chuẩn bị cho permission matrix

| Module | Resource ví dụ | Action nền tảng |
| --- | --- | --- |
| User & Role | user, title, role_group, permission_set | create, read, update, deactivate, assign_role, assign_permission |
| Product | product, category, unit, price_book | create, read, update, archive, import, export |
| Warehouse | warehouse, location, stock_level | create, read, update, archive |
| Inventory | stock_in, stock_out, transfer, stocktake, adjustment | create, read, update, submit, approve, cancel |
| Sales | quotation, order, invoice, return | create, read, update, submit, approve_discount, cancel, print |
| Purchase | supplier, purchase_order, purchase_invoice | create, read, update, submit, approve, cancel |
| Customer | customer, credit_limit, debt | create, read, update, archive, view_debt |
| Finance | payment, receipt, expense, debt_reconciliation | create, read, update, approve, cancel, export |
| Report | sales_report, inventory_report, profit_report, debt_report | view, export |
| Settings | tenant, branch, tax, numbering, print_template | read, update |
| Audit | audit_log | view, export |

---

## 7. Permission matrix định hướng ban đầu

> Matrix chi tiết sẽ làm sau. Bảng này định hướng mặc định, không phải implementation cuối.

| Năng lực | Super admin | System admin | Support admin | User |
| --- | --- | --- | --- | --- |
| Quản lý tenant/billing/plan | Có | Không mặc định | Không | Không |
| Tạo/sửa/khóa user | Có | Có | Không mặc định | Không |
| Gán role/permission | Có | Có trong phạm vi tenant | Không mặc định | Không |
| Xem sản phẩm/tồn kho | Có | Có | Có | Có theo scope |
| Tạo/sửa sản phẩm | Có | Có | Có | Không mặc định |
| Tạo đơn hàng | Có | Có | Có | Có |
| Hủy đơn hàng | Có | Có | Có theo rule | Không mặc định |
| Duyệt chiết khấu vượt ngưỡng | Có | Có nếu được cấp | Có nếu được cấp | Không |
| Nhập/xuất/chuyển kho | Có | Có | Có | Có nếu thuộc kho |
| Điều chỉnh tồn kho | Có | Có | Có nếu được cấp | Không mặc định |
| Xem báo cáo doanh thu | Có | Có nếu được cấp | Có | Không mặc định |
| Xem báo cáo lợi nhuận | Có | Không mặc định | Không mặc định | Không |
| Export dữ liệu | Có | Có nếu được cấp | Có nếu được cấp | Không mặc định |
| Xem audit log | Có | Có | Có nếu auditor/manager | Không |

---

## 8. Business rules quan trọng

1. **Backend enforce toàn bộ quyền.** Frontend chỉ ẩn/hiện UI để tăng trải nghiệm.
2. **Không hard delete dữ liệu nghiệp vụ mặc định.** Dùng archive, cancel, reverse, void.
3. **Hành động tiền/hàng phải audit.** Ví dụ sửa giá, hủy đơn, điều chỉnh tồn, ghi nhận thanh toán.
4. **Separation of duties.** Nên tránh một user tự tạo, tự duyệt, tự hủy và tự điều chỉnh cùng một chứng từ nếu cửa hàng bật kiểm soát nâng cao.
5. **Quyền theo scope.** Nhân viên kho A không mặc định xem/sửa kho B.
6. **Override có kiểm soát.** Permission riêng lẻ có thể override role group, nhưng phải audit.
7. **User bị khóa không được đăng nhập**, nhưng record lịch sử vẫn giữ nguyên người tạo/người sửa.
8. **Title đổi không được xóa audit cũ.** Lịch sử record vẫn phản ánh user tại thời điểm thao tác.

---

## 9. Data model định hướng

```text
tenants
users
tenant_users

titles
role_groups
permissions
role_group_permissions
user_permission_overrides
user_scopes

audit_logs
```

Gợi ý trường chính:

```text
tenant_users:
- id
- tenant_id
- user_id
- title_id
- role_group_id
- status: active | invited | suspended | left
- invited_by
- joined_at
- left_at

permissions:
- id
- key
- module
- resource
- action
- description

user_permission_overrides:
- tenant_user_id
- permission_id
- effect: allow | deny
- reason
- created_by
- created_at

user_scopes:
- tenant_user_id
- scope_type: tenant | branch | warehouse | own_records | assigned_records
- scope_id nullable
```

---

## 10. Open decisions

1. Có cần phân biệt `platform_admin` của HomyHubs với `tenant_super_admin` của từng cửa hàng ngay từ đầu không?
2. Có bắt buộc 2 bước duyệt cho hủy đơn/điều chỉnh tồn/thay đổi giá không?
3. Có cho nhân viên bán hàng xem công nợ khách hàng không, hay chỉ quản lý/kế toán?
4. Có cần phân quyền theo chi nhánh ngay MVP không, hay chỉ theo tenant + warehouse?
5. Có cần ca làm việc và giới hạn quyền theo thời gian làm việc không?
6. Có cần approval workflow cho chiết khấu vượt ngưỡng không?

---

## 11. MVP đề xuất

MVP nên có:

- Title: Chủ cửa hàng, Quản trị hệ thống, Quản lý cửa hàng, Nhân viên bán hàng, Thủ kho, Kế toán.
- Role group: Super admin, System admin, Support admin, User.
- Permission matrix cơ bản theo module/action.
- Scope tối thiểu: tenant, warehouse, own_records.
- Audit log cho: login, tạo/sửa/khóa user, gán quyền, tạo/sửa/hủy đơn, nhập/xuất kho, điều chỉnh tồn, thanh toán.

Chưa cần quá phức tạp ở MVP:

- Ca làm việc.
- Approval nhiều tầng.
- Platform admin nâng cao.
- Permission theo từng field.
