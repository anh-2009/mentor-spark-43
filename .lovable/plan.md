

# Plan: Notes/Journal đơn giản

## Database
- Tạo bảng `notes` với: `id`, `user_id`, `title`, `content`, `created_at`, `updated_at`
- RLS: full CRUD cho owner (`auth.uid() = user_id`)
- Trigger `updated_at` tự động cập nhật

## Frontend — `src/pages/Notes.tsx`
- Layout đơn giản: danh sách ghi chú + form tạo/sửa
- Chức năng: tạo mới, chỉnh sửa inline, xóa (có confirm)
- Sắp xếp theo `updated_at` mới nhất

## Routing & Navigation
- Thêm route `/notes` (ProtectedRoute) trong `App.tsx`
- Thêm nav item `StickyNote` vào `Navbar.tsx`

## Thứ tự
1. Database migration
2. Tạo `Notes.tsx`
3. Cập nhật `App.tsx` + `Navbar.tsx`

