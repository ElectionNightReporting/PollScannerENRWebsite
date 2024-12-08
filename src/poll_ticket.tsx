import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface Location {
  county: string;
  state: string;
  precinct: {
    township: string;
    number: string;
  };
}

interface ElectionHeader {
  type: string;
  date: string;
  location: Location;
}

interface VotingSystem {
  type: string;
  serial_number: string;
  version: string;
}

interface PollReport {
  timestamp: string;
  counters: {
    ballot_counter: string;
    lifetime_counter: string;
  };
  status: {
    polls_open: boolean;
    accepting_ballots: boolean;
  };
}

interface Candidate {
  ticket: string[];
  votes: string;
}

interface Contest {
  title: string;
  candidates: Candidate[];
  metadata: {
    write_ins: string;
    undervotes: string;
    overvotes: string;
    invalid_votes: string;
  };
}

interface PollTicket {
  election_header: ElectionHeader;
  voting_system: VotingSystem;
  reports: {
    open_polls: PollReport;
    closed_polls?: PollReport;
  };
  tally_report: {
    precincts_included: string;
  };
  results: {
    contests: Contest[];
  };
  totals: {
    precinct_ballot_count: {
      precinct: {
        name: string;
        total: string;
      };
      grand_total: string;
    };
  };
}

export function PollTicket({ data }: { data: PollTicket }) {
  const [showDetails, setShowDetails] = useState(false);

  // Helper function to determine winner(s) of each contest
  const getContestWinners = (contest: Contest) => {
    const maxVotes = Math.max(
      ...contest.candidates.map((c) => parseInt(c.votes))
    );
    return contest.candidates.filter((c) => parseInt(c.votes) === maxVotes);
  };

  // Add helper to filter out straight party tickets
  const getNonStraightPartyContests = (contests: Contest[]) => {
    return contests.filter(contest => 
      !contest.title.toLowerCase().includes('straight party')
    );
  };

  return (
    <Card className="w-full max-w-3xl">
      <CardHeader>
        <CardTitle className="text-center">
          {data.election_header.type}
        </CardTitle>
        <div className="text-sm text-center text-muted-foreground">
          {format(new Date(data.election_header.date), "MMMM d, yyyy")}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Basic Location Info - Always Show */}
        <div className="text-center">
          <p>
            {data.election_header.location.county} County,{" "}
            {data.election_header.location.state}
          </p>
          <p>
            Precinct: {data.election_header.location.precinct.township} -{" "}
            {data.election_header.location.precinct.number}
          </p>
        </div>

        {/* Contest Winners */}
        <div className="border-t pt-4">
          <h3 className="font-semibold mb-4">Election Results</h3>
          {getNonStraightPartyContests(data.results.contests).map((contest, index) => (
            <div key={index} className="mb-4">
              <h4 className="font-medium">{contest.title}</h4>
              {getContestWinners(contest).map((winner, winnerIndex) => (
                <div
                  key={winnerIndex}
                  className="mt-2 font-semibold text-green-600"
                >
                  Winner: {winner.ticket.join(", ")} - {winner.votes} votes
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Toggle Details Button */}
        <div className="text-center">
          <Button
            variant="outline"
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? "Show Less" : "Show Original Poll Tape"}
          </Button>
        </div>

        {/* Detailed Information */}
        {showDetails && (
          <>
            {/* Voting System Info */}
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2">Voting System</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <p>Type: {data.voting_system.type}</p>
                <p>S/N: {data.voting_system.serial_number}</p>
                <p>Version: {data.voting_system.version}</p>
              </div>
            </div>

            {/* Poll Status */}
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2">Poll Status</h3>
              <div className="space-y-2">
                <div>
                  <h4 className="font-medium">Opened:</h4>
                  <p>
                    {format(
                      new Date(data.reports.open_polls.timestamp),
                      "PPpp"
                    )}
                  </p>
                  <p>
                    Ballot Counter:{" "}
                    {data.reports.open_polls.counters.ballot_counter}
                  </p>
                </div>
                {data.reports.closed_polls && (
                  <div>
                    <h4 className="font-medium">Closed:</h4>
                    <p>
                      {format(
                        new Date(data.reports.closed_polls.timestamp),
                        "PPpp"
                      )}
                    </p>
                    <p>
                      Final Counter:{" "}
                      {data.reports.closed_polls.counters.ballot_counter}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Detailed Contest Results */}
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-4">Detailed Results</h3>
              {data.results.contests.map((contest, index) => {
                const winners = getContestWinners(contest);
                return (
                  <div key={index} className="mb-4">
                    <h4 className="font-medium">{contest.title}</h4>
                    {contest.candidates.map((candidate, candidateIndex) => (
                      <div key={candidateIndex} className="mt-2">
                        <p
                          className={
                            winners.includes(candidate) && 
                            !contest.title.toLowerCase().includes('straight party')
                              ? "text-green-600 font-semibold"
                              : ""
                          }
                        >
                          {candidate.ticket.join(", ")} - {candidate.votes}
                        </p>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
