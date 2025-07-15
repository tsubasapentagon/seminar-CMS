import { supabase } from "../supabase";

export const insertShift = async ({
  user_id,
  seminar_id,
  shift_date,
  shift_time,
}: {
  user_id: string;
  seminar_id: string;
  shift_date: string;
  shift_time: string;
}) => {
  const { data, error } = await supabase.from("shifts").insert({
    user_id,
    seminar_id,
    shift_date,
    shift_time,
    status: "申",
  });

  return { data, error };
};

export const getShiftsByUser = async (userId: string) => {
  const { data, error } = await supabase
    .from("shifts")
    .select("*")
    .eq("user_id", userId)
    .order("shift_date", { ascending: true });

  return { data, error };
};
