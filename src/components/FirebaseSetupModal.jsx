import React, { useState } from 'react';
import {
  X,
  Cloud,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  Key,
  Database,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  UploadCloud
} from 'lucide-react';
import {
  saveFirebaseConfig,
  getSavedFirebaseConfig,
  initFirebase,
  pushDataToCloud
} from '../services/firebaseSync';

export default function FirebaseSetupModal({
  isOpen,
  onClose,
  fullData,
  onConfigSaved,
  onNotify
}) {
  const existingConfig = getSavedFirebaseConfig();
  const [configText, setConfigText] = useState(
    existingConfig ? JSON.stringify(existingConfig, null, 2) : ''
  );
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [activeTab, setActiveTab] = useState('config'); // 'config' | 'guide'

  if (!isOpen) return null;

  const handleSaveAndTest = async () => {
    setIsTesting(true);
    setTestResult(null);

    let parsed = null;
    try {
      // Allow pasting either raw JSON or JavaScript object syntax
      let cleaned = configText.trim();
      if (cleaned.startsWith('const firebaseConfig =')) {
        cleaned = cleaned.replace('const firebaseConfig =', '').trim().replace(/;$/, '');
      }
      // If keys are unquoted, fix them or parse safely
      try {
        parsed = JSON.parse(cleaned);
      } catch {
        // Fallback eval in safe scope
        const fn = new Function(`return (${cleaned});`);
        parsed = fn();
      }

      if (!parsed || !parsed.apiKey || !parsed.projectId) {
        throw new Error('Missing apiKey or projectId in Firebase configuration.');
      }
    } catch (err) {
      setIsTesting(false);
      setTestResult({
        success: false,
        message: 'Invalid configuration format. براہ کرم صحیح Firebase Config پیسٹ کریں۔'
      });
      return;
    }

    // Save in storage
    saveFirebaseConfig(parsed);
    const db = initFirebase(parsed);

    if (!db) {
      setIsTesting(false);
      setTestResult({
        success: false,
        message: 'Firebase Initialize Failed. براہ کرم keys دوبارہ چیک کریں۔'
      });
      return;
    }

    // Upload current local state to cloud
    try {
      const res = await pushDataToCloud(
        fullData,
        'Initial Cloud Sync (System Connected)',
        'Local records uploaded to Firebase Firestore'
      );

      setIsTesting(false);
      if (res.success) {
        setTestResult({
          success: true,
          message: 'مبارک ہو! Firebase Firestore کامیابی سے کنیکٹ ہو گیا اور لوکل ڈیٹا کلاؤڈ پر محفوظ ہو گیا۔'
        });
        if (onNotify) onNotify('Firebase Cloud Database Connected Successfully! ☁️');
        if (onConfigSaved) onConfigSaved(parsed);
      } else {
        setTestResult({
          success: false,
          message: `Connection failed: ${res.error?.message || 'Check Firestore Security Rules'}`
        });
      }
    } catch (e) {
      setIsTesting(false);
      setTestResult({
        success: false,
        message: `Connection error: ${e.message}`
      });
    }
  };

  const handleDisconnect = () => {
    saveFirebaseConfig(null);
    setConfigText('');
    setTestResult({
      success: true,
      message: 'Cloud database disconnected. اب سسٹم لوکل موڈ میں چلے گا۔'
    });
    if (onConfigSaved) onConfigSaved(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 to-blue-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <Cloud className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white tracking-tight">
                Firebase Cloud Sync Setup
              </h3>
              <p className="text-xs text-blue-200/80">
                موبائل اور کمپیوٹر کا 2-Way ریئل ٹائم کلاؤڈ سنکرونائزیشن
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-5 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('config')}
            className={`pb-3 text-xs font-bold transition border-b-2 px-3 ${
              activeTab === 'config'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Config Settings (کنفیگریشن)
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={`pb-3 text-xs font-bold transition border-b-2 px-3 flex items-center gap-1.5 ${
              activeTab === 'guide'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>2-Minute Setup Guide (رہنمائی)</span>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-mono">
              Free
            </span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {activeTab === 'config' ? (
            <div className="space-y-4">
              <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-2xl text-xs text-blue-900 leading-relaxed font-medium">
                💡 <span className="font-bold">یہ کیسے کام کرتا ہے؟</span> گوگل فائر بیس کی کنفیگ یہاں پیسٹ کر کے محفوظ کریں، جس کے بعد آپ موبائل اور کمپیوٹر دونوں پر ایک ہی لائیو ڈیٹا بغیر کسی رکاوٹ کے استعمال کر سکیں گے۔
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Firebase Web Configuration (JSON / Object):
                </label>
                <textarea
                  rows={8}
                  value={configText}
                  onChange={(e) => setConfigText(e.target.value)}
                  placeholder={`{\n  "apiKey": "AIzaSy...",\n  "authDomain": "amh-building.firebaseapp.com",\n  "projectId": "amh-building",\n  "storageBucket": "amh-building.firebasestorage.app",\n  "messagingSenderId": "...",\n  "appId": "1:..."\n}`}
                  className="w-full p-3 font-mono text-xs bg-slate-900 text-emerald-400 rounded-xl border border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {testResult && (
                <div
                  className={`p-3.5 rounded-xl border text-xs font-medium flex items-start gap-2.5 ${
                    testResult.success
                      ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                      : 'bg-rose-50 text-rose-900 border-rose-200'
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className="font-bold">{testResult.success ? 'کامیابی (Success)' : 'غلطی (Error)'}</p>
                    <p className="mt-0.5">{testResult.message}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                {existingConfig ? (
                  <button
                    onClick={handleDisconnect}
                    type="button"
                    className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
                  >
                    Disconnect Cloud (منقطع کریں)
                  </button>
                ) : (
                  <div />
                )}

                <button
                  onClick={handleSaveAndTest}
                  disabled={isTesting || !configText.trim()}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold py-2.5 px-6 rounded-xl text-xs transition flex items-center gap-2 shadow-md shadow-blue-600/20 cursor-pointer"
                >
                  {isTesting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <UploadCloud className="w-4 h-4" />
                  )}
                  <span>{isTesting ? 'Connecting & Uploading...' : 'Save & Sync Now'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 text-xs text-slate-700">
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-950 font-medium">
                ✅ <span className="font-bold">فائر بیس 100% مفت ہے:</span> گوگل کا فائر بیس فائر اسٹور ڈیٹا بیس لائف ٹائم فری ٹائر دیتا ہے جو عمارت کے 20 فلیٹس کے لیے ہمیشہ کافی ہے۔
              </div>

              <div className="space-y-3 font-medium">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                    1
                  </span>
                  <div>
                    <h5 className="font-bold text-slate-900">Google Firebase Console کھولیں</h5>
                    <p className="text-slate-600 mt-0.5">
                      براؤزر میں{' '}
                      <a
                        href="https://console.firebase.google.com"
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 font-bold underline inline-flex items-center gap-0.5"
                      >
                        <span>console.firebase.google.com</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>{' '}
                      پر جائیں اور اپنے جی میل اکاؤنٹ سے لاگ ان کریں۔
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                    2
                  </span>
                  <div>
                    <h5 className="font-bold text-slate-900">نیا پروجیکٹ بنائیں</h5>
                    <p className="text-slate-600 mt-0.5">
                      <b>"Create a project"</b> پر کلک کریں اور نام رکھیں (مثلاً: <code>al-mustafa-heights</code>)۔ Google Analytics کو بند کر کے پروجیکٹ مکمل کریں۔
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                    3
                  </span>
                  <div>
                    <h5 className="font-bold text-slate-900">Firestore Database آن کریں</h5>
                    <p className="text-slate-600 mt-0.5">
                      بائیں مینو سے <b>Build ➔ Firestore Database</b> منتخب کریں اور <b>Create database</b> دبائیں۔ <b>Start in test mode</b> منتخب کر کے Create پر کلک کریں۔
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                    4
                  </span>
                  <div>
                    <h5 className="font-bold text-slate-900">Web App بنا کر Keys کاپی کریں</h5>
                    <p className="text-slate-600 mt-0.5">
                      Project Overview میں <b>Web Icon (&lt;/&gt;)</b> پر کلک کریں، ایپ کا نام رکھیں، اور سکرین پر آنے والا <code>firebaseConfig</code> کا کوڈ کاپی کر کے پچھلے ٹیب میں پیسٹ کر دیں۔
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
