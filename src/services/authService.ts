import { 
  sendPasswordResetEmail, 
  RecaptchaVerifier, 
  signInWithPhoneNumber,
  ConfirmationResult
} from "firebase/auth";
import { auth } from "../lib/firebase";

// ------------------------------------------------------
// استعادة كلمة المرور عبر الإيميل
// ------------------------------------------------------
export async function resetPassword(email: string) {
  try {
    await sendPasswordResetEmail(auth, email);
    // Note: We use state-based UI in the app, 
    // but the user requested an alert in their snippet
    alert("تم إرسال رابط استعادة كلمة المرور إلى البريد الإلكتروني");
    return { success: true };
  } catch (error) {
    console.error(error);
    alert("حدث خطأ أثناء إرسال البريد");
    throw error;
  }
}

// ------------------------------------------------------
// إرسال كود OTP للهاتف
// ------------------------------------------------------
export async function sendOTP(phoneNumber: string) {
  try {
    // Ensure recaptcha container exists in the DOM
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
        'size': 'invisible'
      });
    }

    const appVerifier = window.recaptchaVerifier;
    const formattedPhone = phoneNumber.startsWith("+") ? phoneNumber : `+${phoneNumber.replace(/^0/, '')}`;

    const confirmationResult = await signInWithPhoneNumber(
      auth,
      formattedPhone,
      appVerifier
    );

    window.confirmationResult = confirmationResult;
    alert("تم إرسال رمز التحقق");
    return confirmationResult;
  } catch (error) {
    console.error(error);
    alert("فشل إرسال الرمز");
    throw error;
  }
}

// ------------------------------------------------------
// التحقق من كود OTP
// ------------------------------------------------------
export async function verifyOTP(code: string) {
  try {
    if (!window.confirmationResult) {
      throw new Error("No confirmation result found. Send OTP first.");
    }

    const result = await window.confirmationResult.confirm(code);
    const user = result.user;

    alert("تم التحقق بنجاح");
    console.log(user);
    return user;
  } catch (error) {
    console.error(error);
    alert("رمز التحقق غير صحيح");
    throw error;
  }
}

// Type declarations for window object
declare global {
  interface Window {
    recaptchaVerifier: any;
    confirmationResult: ConfirmationResult | null;
  }
}
