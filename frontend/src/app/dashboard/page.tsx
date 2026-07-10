"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  supabase,
} from "@/lib/supabase";

import type {
  IdeaResult,
} from "@/lib/api";


interface Voyage {
  id: string;

  user_id: string;

  created_at:
    string | null;

  interests:
    string[] | null;

  results:
    IdeaResult[] | {
      ideas?: IdeaResult[];
    } | null;
}


export default function DashboardPage() {
  const [
    voyages,
    setVoyages,
  ] = useState<Voyage[]>([]);

  const [
    selectedVoyage,
    setSelectedVoyage,
  ] = useState<Voyage | null>(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState<string | null>(null);


  useEffect(() => {
    async function loadVoyages() {
      setLoading(true);
      setError(null);


      const {
        data: { user },
        error: authError,
      } =
        await supabase.auth.getUser();


      if (
        authError
        || !user
      ) {
        console.error(
          "VOYAGES AUTH ERROR:",
          authError
        );


        setError(
          "You must be logged in to view voyages."
        );

        setLoading(false);

        return;
      }


      console.log(
        "LOADING VOYAGES FOR:",
        user.id
      );


      const {
        data,
        error: voyageError,
      } =
        await supabase
          .from("voyages")
          .select(
            "id, user_id, interests, results, created_at"
          )
          .eq(
            "user_id",
            user.id
          )
          .order(
            "created_at",
            {
              ascending: false,
            }
          );


      console.log(
        "VOYAGES DATA:",
        data
      );

      console.log(
        "VOYAGES ERROR:",
        voyageError
      );


      if (voyageError) {
        setError(
          `${voyageError.code}: ${voyageError.message}`
        );

        setLoading(false);

        return;
      }


      const loadedVoyages =
        (data ?? []) as Voyage[];


      setVoyages(
        loadedVoyages
      );


      if (
        loadedVoyages.length > 0
      ) {
        setSelectedVoyage(
          loadedVoyages[0]
        );
      }


      setLoading(false);
    }


    loadVoyages();

  }, []);


  const getIdeas = (
    voyage: Voyage
  ): IdeaResult[] => {

    if (
      Array.isArray(
        voyage.results
      )
    ) {
      return voyage.results;
    }


    return (
      voyage.results?.ideas
      ?? []
    );
  };


  return (
    <div className="flex h-full min-h-screen">

      <aside className="w-80 border-r border-navy-700 bg-navy-900 p-4 overflow-y-auto">

        <h2 className="text-gold-400 font-bold text-lg mb-4">
          Saved Voyages
        </h2>


        {loading ? (

          <p className="text-gray-400">
            Loading voyages...
          </p>

        ) : error ? (

          <p className="text-red-400 text-sm">
            {error}
          </p>

        ) : voyages.length === 0 ? (

          <p className="text-gray-400">
            No voyages yet. Start discovering!
          </p>

        ) : (

          <ul className="space-y-2">

            {voyages.map(
              (voyage) => (

                <li
                  key={
                    voyage.id
                  }
                >

                  <button
                    onClick={() =>
                      setSelectedVoyage(
                        voyage
                      )
                    }

                    className={
                      `w-full text-left p-3 rounded-lg transition-colors ${
                        selectedVoyage?.id
                        === voyage.id

                          ? "bg-navy-700 border border-gold-400"

                          : "bg-navy-800 hover:bg-navy-700"
                      }`
                    }
                  >

                    <p className="text-white font-medium truncate">

                      {
                        (
                          voyage.interests
                          ?? []
                        ).join(", ")
                        || "Untitled Voyage"
                      }

                    </p>


                    <p className="text-gray-400 text-sm">

                      {
                        voyage.created_at

                          ? new Date(
                              voyage.created_at
                            )
                              .toLocaleDateString()

                          : "Unknown date"
                      }

                    </p>

                  </button>

                </li>

              )
            )}

          </ul>

        )}

      </aside>


      <main className="flex-1 p-8 overflow-y-auto">

        {selectedVoyage ? (

          <div>

            <h1 className="text-2xl font-bold text-white mb-2">
              Voyage Details
            </h1>


            <p className="text-gray-400 mb-6">

              {
                selectedVoyage.created_at

                  ? new Date(
                      selectedVoyage.created_at
                    )
                      .toLocaleDateString()

                  : "Unknown date"
              }

            </p>


            <div className="mb-6">

              <h3 className="text-gold-400 font-semibold mb-2">
                Interests
              </h3>


              <div className="flex flex-wrap gap-2">

                {
                  (
                    selectedVoyage.interests
                    ?? []
                  ).map(
                    (interest) => (

                      <span
                        key={
                          interest
                        }

                        className="px-3 py-1 bg-navy-700 text-white rounded-full text-sm"
                      >
                        {interest}
                      </span>

                    )
                  )
                }

              </div>

            </div>


            <div>

              <h3 className="text-gold-400 font-semibold mb-4">
                Discovered Ideas
              </h3>


              <div className="space-y-4">

                {
                  getIdeas(
                    selectedVoyage
                  ).map(
                    (
                      idea,
                      index
                    ) => (

                      <div
                        key={
                          index
                        }

                        className="p-4 bg-navy-800 rounded-lg border border-navy-600"
                      >

                        <h4 className="text-white font-bold mb-2">
                          {
                            idea.title
                            || "Untitled Idea"
                          }
                        </h4>


                        <p className="text-gray-300">
                          {
                            idea.description
                          }
                        </p>

                      </div>

                    )
                  )
                }


                {
                  getIdeas(
                    selectedVoyage
                  ).length === 0
                  && (

                    <p className="text-gray-400">
                      No ideas stored for this voyage.
                    </p>

                  )
                }

              </div>

            </div>

          </div>

        ) : (

          <div className="flex items-center justify-center h-full">

            <p className="text-gray-400 text-lg">

              {
                loading
                  ? "Loading voyages..."
                  : "Select a voyage to view its discoveries."
              }

            </p>

          </div>

        )}

      </main>

    </div>
  );
}