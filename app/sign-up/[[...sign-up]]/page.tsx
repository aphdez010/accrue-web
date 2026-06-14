import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F0F4F1]">
      <SignUp />
    </div>
  );
}
