
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth, db } from "./firebase";
import toast from "react-hot-toast";
import { setDoc, doc } from "firebase/firestore";

function SignInwithGoogle() {
  async function googleLogin() {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });

    try {
      const result = await signInWithPopup(auth, provider);
      console.log(result);
      const user = result.user;
      if (result.user) {
        await setDoc(doc(db, "Users", user.uid), {
          email: user.email,
          firstName: user.displayName,
          photo: user.photoURL,
          lastName: "",
        });
        toast.success("User logged in Successfully", {
          position: "top-center",
        });
        window.location.href = "/profile";
      }
    } catch (error) {
      console.error("Google sign-in failed:", error);

      const firebaseCode = error?.code;
      if (String(firebaseCode).includes("api-key-not-valid")) {
        toast.error("Firebase API key is invalid. Update VITE_FIREBASE_API_KEY and restart dev server.");
        return;
      }
      if (firebaseCode === "auth/popup-closed-by-user") {
        toast.error("Google sign-in window was closed before completion.");
        return;
      }
      if (firebaseCode === "auth/popup-blocked") {
        toast.error("Popup was blocked by browser. Allow popups and try again.");
        return;
      }
      if (firebaseCode === "auth/unauthorized-domain") {
        toast.error("Current domain is not authorized in Firebase Auth.");
        return;
      }

      toast.error("Google sign-in failed. Check console for details.");
    }
  }
  return (
    <div> 
      <button
                type="button"
                onClick={googleLogin}
                className="flex w-60 items-center justify-center gap-3 rounded-xl border border-(--app-color-border) bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
            >
                <img
                    src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                    alt="Google"
                    className="h-5 w-5"
                />
                Sign up with Google
            </button>
    </div>
  );
}
export default SignInwithGoogle;