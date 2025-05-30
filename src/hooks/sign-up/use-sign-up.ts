"use client";

import { useToast } from "@/components/ui/use-toast";
import {
  UserRegistrationProps,
  UserRegistrationSchema,
} from "@/schemas/auth.schema";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { onCompleteUserRegistration } from "@/action/auth";
import {useSignUp} from "@clerk/nextjs";

export const useSignUpForm = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState<boolean>(false);
  const { signUp, isLoaded, setActive } = useSignUp();
  const router = useRouter();
  const methods = useForm<UserRegistrationProps>({
    resolver: zodResolver(UserRegistrationSchema),
    defaultValues: {
      type: "owner",
    },
    mode: "onChange",
  });

  const onGenerateOTP = async (
    email: string,
    password: string,
    onNext: React.Dispatch<React.SetStateAction<number>>,
  ) => {
    if (!isLoaded) return;

    try {
      await signUp.create({
        emailAddress: email,
        password: password,
      });

      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });

      onNext((prev) => prev + 1);
    } catch (error: any) {
      toast({
        title: "Error",
        description: getErrorMessage(error),
      });
    }
  };

  const getErrorMessage = (error: any): string => {
    return error?.errors?.[0]?.longMessage || error?.message || "Unexpected error occurred.";
  };

  const onHandleSubmit = methods.handleSubmit(
    async (values: UserRegistrationProps) => {
      if (!isLoaded) return;

      try {
        setLoading(true);
        const completeSignUp = await signUp.attemptEmailAddressVerification({
          code: values.otp,
        });

        if (completeSignUp.status !== "complete") {
          return { message: "Something went wrong!" };
        }

        if (completeSignUp.status === "complete") {
          if (!signUp.createdUserId) return;

          const registered = await onCompleteUserRegistration(
            values.fullname,
            signUp.createdUserId,
            values.type,
          );

          console.log(registered);

          if (registered?.status === 200 && registered.user) {
            await setActive({
              session: completeSignUp.createdSessionId,
            });

            setLoading(false);
            router.push("/dashboard");
          }

          if (registered?.status === 400) {
            toast({
              title: "Error",
              description: "Something went wrong!",
            });
          }
        }
      } catch (error: any) {
        console.log(error)
        toast({
          title: "Error",
          description: error.errors[0].longMessage,
        });
      }
    },
  );

  return {
    methods,
    onHandleSubmit,
    onGenerateOTP,
    loading,
  };
};
