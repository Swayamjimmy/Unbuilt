"use client";

import {
  useEffect,
  useState,
} from "react";

import Link from "next/link";

import {
  supabase,
} from "@/lib/supabase";


type Message = {
  type: "success" | "error";
  text: string;
};


export default function ProfilePage() {
  const [
    techStack,
    setTechStack,
  ] = useState<string[]>([]);

  const [
    newTech,
    setNewTech,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    message,
    setMessage,
  ] = useState<Message | null>(null);

  const [
    isAuthenticated,
    setIsAuthenticated,
  ] = useState(true);


  useEffect(() => {
    async function loadProfile() {
      setLoading(true);


      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();


      if (authError || !user) {
        console.error(
          "PROFILE AUTH ERROR:",
          authError
        );

        setIsAuthenticated(false);
        setLoading(false);

        return;
      }


      console.log(
        "PROFILE USER ID:",
        user.id
      );


      setIsAuthenticated(true);


      const {
        data,
        error,
      } = await supabase
        .from("profiles")
        .select("tech_stack")
        .eq(
          "user_id",
          user.id
        )
        .maybeSingle();


      console.log(
        "PROFILE LOAD DATA:",
        data
      );

      console.log(
        "PROFILE LOAD ERROR:",
        error
      );


      if (error) {
        setMessage({
          type: "error",
          text:
            `${error.code}: ${error.message}`,
        });

        setLoading(false);

        return;
      }


      if (data) {
        setTechStack(
          data.tech_stack ?? []
        );
      }


      setLoading(false);
    }


    loadProfile();
  }, []);


  async function saveProfile() {
    setSaving(true);
    setMessage(null);


    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();


      if (authError) {
        console.error(
          "PROFILE AUTH ERROR:",
          authError
        );

        setMessage({
          type: "error",
          text: authError.message,
        });

        return;
      }


      if (!user) {
        setIsAuthenticated(false);

        setMessage({
          type: "error",
          text:
            "You must be logged in to save.",
        });

        return;
      }


      console.log(
        "SAVING PROFILE FOR USER:",
        user.id
      );


      console.log(
        "TECH STACK:",
        techStack
      );


      const {
        data,
        error,
      } = await supabase
        .from("profiles")
        .upsert(
          {
            user_id: user.id,
            tech_stack: techStack,
          },
          {
            onConflict: "user_id",
          }
        )
        .select();


      console.log(
        "PROFILE SAVE DATA:",
        data
      );

      console.log(
        "PROFILE SAVE ERROR:",
        error
      );


      if (error) {
        setMessage({
          type: "error",
          text:
            `${error.code}: ${error.message}`,
        });

        return;
      }


      setMessage({
        type: "success",
        text:
          "Profile saved successfully!",
      });

    } catch (error) {
      console.error(
        "UNEXPECTED PROFILE ERROR:",
        error
      );


      setMessage({
        type: "error",

        text:
          error instanceof Error
            ? error.message
            : "Unexpected profile error.",
      });

    } finally {
      setSaving(false);
    }
  }


  function addTech() {
    const trimmedTech =
      newTech.trim();


    if (!trimmedTech) {
      return;
    }


    const alreadyExists =
      techStack.some(
        (tech) =>
          tech.toLowerCase()
          === trimmedTech.toLowerCase()
      );


    if (alreadyExists) {
      setNewTech("");

      return;
    }


    setTechStack(
      (currentTechStack) => [
        ...currentTechStack,
        trimmedTech,
      ]
    );


    setNewTech("");
  }


  function removeTech(
    techToRemove: string
  ) {
    setTechStack(
      (currentTechStack) =>
        currentTechStack.filter(
          (tech) =>
            tech !== techToRemove
        )
    );
  }


  if (
    !loading
    && !isAuthenticated
  ) {
    return (
      <div className="max-w-2xl mx-auto p-8 flex flex-col items-center justify-center min-h-[50vh] text-center">

        <div className="text-gold-500 mb-4">

          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-16 h-16 mx-auto"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >

            <circle
              cx="12"
              cy="12"
              r="10"
            />

            <polygon
              points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"
            />

          </svg>

        </div>


        <h1 className="text-2xl font-bold text-white mb-2">

          Authentication Required

        </h1>


        <p className="text-gray-400 mb-6">

          You need to chart your course
          before viewing your profile.

        </p>


        <Link
          href="/"

          className="px-6 py-3 bg-gold-500 text-navy-900 font-bold rounded-lg hover:bg-gold-400 transition-colors"
        >
          Return to Sign In
        </Link>

      </div>
    );
  }


  return (
    <div className="max-w-2xl mx-auto p-8">

      <h1 className="text-2xl font-bold text-white mb-6">

        Your Profile

      </h1>


      {loading ? (

        <div className="flex items-center gap-3">

          <div className="w-5 h-5 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />


          <p className="text-gray-400">

            Loading profile...

          </p>

        </div>

      ) : (

        <div>

          <h2 className="text-gold-400 font-semibold mb-4">

            Tech Stack

          </h2>


          <div className="flex flex-wrap gap-2 mb-4">

            {techStack.length === 0 && (

              <p className="text-gray-500 text-sm italic">

                No technologies added yet.

              </p>

            )}


            {techStack.map(
              (tech) => (

                <span
                  key={tech}

                  className="px-3 py-1 bg-navy-700 border border-navy-600 text-white rounded-full text-sm flex items-center gap-2 transition-colors"
                >

                  {tech}


                  <button
                    type="button"

                    onClick={() =>
                      removeTech(tech)
                    }

                    className="text-gray-400 hover:text-red-400 focus:outline-none"

                    aria-label={
                      `Remove ${tech}`
                    }
                  >
                    &times;
                  </button>

                </span>

              )
            )}

          </div>


          <div className="flex gap-2 mb-6">

            <input
              type="text"

              value={newTech}

              onChange={
                (event) =>
                  setNewTech(
                    event.target.value
                  )
              }

              onKeyDown={
                (event) => {
                  if (
                    event.key === "Enter"
                  ) {
                    event.preventDefault();

                    addTech();
                  }
                }
              }

              placeholder="Add a technology (e.g. Golang, Node.js, C++)..."

              className="flex-1 px-4 py-2 bg-navy-800 border border-navy-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gold-500 transition-all"
            />


            <button
              type="button"

              onClick={addTech}

              disabled={
                !newTech.trim()
              }

              className="px-4 py-2 bg-navy-700 text-gold-400 border border-navy-600 font-semibold rounded-lg hover:bg-navy-600 disabled:opacity-50 transition-colors"
            >
              Add
            </button>

          </div>


          <div className="flex items-center gap-4 mt-8">

            <button
              type="button"

              onClick={saveProfile}

              disabled={saving}

              className="px-6 py-2 bg-gold-500 text-navy-900 font-bold rounded-lg hover:bg-gold-400 disabled:opacity-50 transition-colors"
            >

              {
                saving
                  ? "Saving..."
                  : "Save Profile"
              }

            </button>


            {message && (

              <span
                className={
                  `text-sm font-medium ${
                    message.type === "success"
                      ? "text-green-400"
                      : "text-red-400"
                  }`
                }
              >

                {message.text}

              </span>

            )}

          </div>

        </div>

      )}

    </div>
  );
}