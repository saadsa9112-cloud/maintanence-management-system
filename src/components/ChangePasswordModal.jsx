import React, { useState } from 'react';
import { KeyRound, Lock, Eye, EyeOff, Check, X, ShieldCheck, AlertCircle } from 'lucide-react';

export default function ChangePasswordModal({
  isOpen,
  onClose,
  currentStoredPassword = '123',
  onUpdatePassword,
  onNotify
}) {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (oldPassword !== currentStoredPassword) {
      setErrorMsg('موجودہ پرانا پاس ورڈ درست نہیں ہے۔ (Current password incorrect)');
      return;
    }

    if (!newPassword || newPassword.trim().length < 3) {
      setErrorMsg('نیا پاس ورڈ کم از کم 3 حروف پر مشتمل ہونا چاہیے۔ (Minimum 3 chars)');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('نیا پاس ورڈ اور تصدیقی پاس ورڈ آپس میں مماثل نہیں ہیں۔ (Passwords do not match)');
      return;
    }

    onUpdatePassword(newPassword.trim());
    if (onNotify) onNotify('پاس ورڈ کامیابی سے تبدیل کر دیا گیا ہے! 🔐✓');
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl sm:rounded-3xl max-w-md w-full p-4 sm:p-6 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-200 my-auto max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 end-4 text-slate-400 hover:text-slate-700 p-1 rounded-xl hover:bg-slate-100 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-700 flex items-center justify-center font-bold">
            <KeyRound className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h3 className="font-black text-base text-slate-900">
              ایڈمن پاس ورڈ تبدیل کریں
            </h3>
            <p className="text-xs text-slate-500">
              Change System Admin Password
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="mt-3 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              موجودہ پرانا پاس ورڈ (Current Password)
            </label>
            <div className="relative">
              <input
                type={showPasswords ? 'text' : 'password'}
                required
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="موجودہ پاس ورڈ درج کریں"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30 pe-10"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              نیا پاس ورڈ (New Password)
            </label>
            <input
              type={showPasswords ? 'text' : 'password'}
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="کم از کم 3 حروف یا اعداد"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              نیا پاس ورڈ دوبارہ درج کریں (Confirm New Password)
            </label>
            <input
              type={showPasswords ? 'text' : 'password'}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="نئے پاس ورڈ کی تصدیق کریں"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
            />
          </div>

          <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
            <button
              type="button"
              onClick={() => setShowPasswords(!showPasswords)}
              className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 transition cursor-pointer font-semibold"
            >
              {showPasswords ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{showPasswords ? 'پاس ورڈ چھپائیں' : 'پاس ورڈ دیکھیں'}</span>
            </button>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            >
              منسوخ (Cancel)
            </button>
            <button
              type="submit"
              className="bg-slate-900 hover:bg-slate-800 text-white font-black px-4 py-2 rounded-xl text-xs transition shadow-sm cursor-pointer"
            >
              پاس ورڈ محفوظ کریں
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
