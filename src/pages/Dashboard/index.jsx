import axios from "axios";
import { format } from "date-fns";
import { formatISO } from "date-fns/esm";
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAsyncFn, useLocalStorage } from "react-use";

import { Card, DateSelect, Icon } from "~/components";

export function Dashboard() {
  const [currentDate, setCurrentDate] = useState(
    formatISO(new Date(2022, 10, 20))
  );

  const [auth] = useLocalStorage("auth", {});

  const [{ value: user, loading, error }, fetchHunches] = useAsyncFn(
    async () => {
      const response = await axios({
        method: "get",
        baseURL: import.meta.env.VITE_API_URL,
        url: `${auth.user.username}`,
      });

      const hunches = response.data.hunches.reduce((accumulator, hunch) => {
        accumulator[hunch.gameId] = hunch;

        return accumulator;
      }, {});

      return {
        ...response.data,
        hunches,
      };
    }
  );

  const [games, fetchGames] = useAsyncFn(async (params) => {
    const response = await axios({
      method: "get",
      baseURL: import.meta.env.VITE_API_URL,
      url: "/games",
      params: params,
    });

    return response.data;
  });

  const isLoading = games.loading || loading;
  const hasError = games.error || error;
  const isDone = !isLoading && !hasError;

  useEffect(() => {
    fetchHunches();
  }, []);

  useEffect(() => {
    fetchGames({ gameTime: currentDate });
  }, [currentDate]);

  if (!auth?.user?.id) {
    return <Navigate to="/" replace={true} />;
  }

  return (
    <>
      <header className="bg-red-500 text-white">
        <div className="container max-w-3xl flex justify-between p-4">
          <img
            src="/imgs/logo-fundo-vermelho.svg"
            alt="Logo do Na Trave"
            className="w-28 md:w-40"
          />

          <a href={`${auth?.user?.username}`}>
            <Icon name="profile" className="w-10" />
          </a>
        </div>
      </header>

      <main className="space-y-6">
        <section id="header" className="bg-red-500 text-white">
          <div className="container max-w-3xl space-y-2 p-4">
            <span>Olá José</span>

            <h3 className="text-2xl font-bold">Qual é o seu palpite?</h3>
          </div>
        </section>

        <section id="content" className="container max-w-3xl p-4 space-y-4">
          <DateSelect currentDate={currentDate} onChange={setCurrentDate} />

          <div className="space-y-4">
            {isLoading && "Carregando jogos..."}

            {hasError && "Ops! Algo deu errado."}

            {isDone &&
              games.value?.map((game) => (
                <Card
                  key={game.id}
                  gameId={game.id}
                  homeTeam={game.homeTeam}
                  awayTeam={game.awayTeam}
                  gameTime={format(new Date(game.gameTime), "H:mm")}
                  homeTeamScore={user?.hunches?.[game.id]?.homeTeamScore || ""}
                  awayTeamScore={user?.hunches?.[game.id]?.awayTeamScore || ""}
                />
              ))}
          </div>
        </section>
      </main>
    </>
  );
}
