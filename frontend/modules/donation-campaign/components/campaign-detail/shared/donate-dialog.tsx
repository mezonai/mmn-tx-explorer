// components/EditProfileDialog.js

import { DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export function DonateDialog() {
  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Chỉnh sửa hồ sơ của bạn</DialogTitle>
        <DialogDescription>Thực hiện các thay đổi và nhấp vào khi hoàn tất.</DialogDescription>
      </DialogHeader>
      <input placeholder="Tên của bạn" />
    </DialogContent>
  );
}
