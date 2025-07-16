import React from "react";
import AnimatedItem from "./AnimatedItem";
import { MdOutlineClose } from "react-icons/md";

const Experience = ({ experience, setexperience }) => {
  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center overflow-auto bg-black bg-opacity-50 transition-opacity ${
        experience ? "opacity-100 visible" : "opacity-0 invisible"
      }`}
    >
      <div className="bg-opacity-100 backdrop-blur-3xl border border-gray-400 w-[1000px] h-[500px] overflow-y-scroll p-1 rounded-lg shadow-xl border-opacity-10">
        <div className="flex">
          <MdOutlineClose
            className="text-white text-4xl ml-auto p-1 hover:bg-red-600 rounded-tr-md rounded-br-md"
            onClick={() => {
              const audio = new Audio("click.wav");
              audio.play();
              setexperience(false);
            }}
          />
        </div>

        <div className="flex flex-col items-start justify-start p-5">
          <AnimatedItem animationConfig={{ delay: 0.1 }}>
            <div className="flex flex-col w-full">
              <h1 className="text-4xl font-medium text-white border-b-2 pb-2 mb-4 border-gray-400 border-opacity-10 w-full">
                Experience
              </h1>
              <section className="mt-2 text-white">
                <div className="container space-y-6">
                  {/* Sapiova Projects */}
                  <div className="flex flex-col space-y-2">
                    <h3 className="text-lg font-medium">2022 - Present</h3>
                    <h4 className="text-md font-medium">
                      Full-Stack Developer & Instructor (Sapiova)
                    </h4>
                    <p className="text-sm">
                      1. Built full-stack web apps using React, Node.js,
                      Express, and PostgreSQL with strong RESTful and GraphQL
                      API design.
                      <br />
                      2. Implemented secure auth systems using JWT, OAuth2, and
                      two-factor login for production apps.
                      <br />
                      3. Designed responsive UI/UX optimized for MacBook,
                      iPhone, iPad using native design principles.
                      <br />
                      4. Deployed scalable apps using Docker, CI/CD pipelines on
                      AWS and Vercel.
                      <br />
                      5. Trained 150+ students in JavaScript, backend API
                      development, frontend architecture, and DevOps best
                      practices.
                    </p>
                  </div>

                  {/* Angela Yu Bootcamp */}
                  <div className="flex flex-col space-y-2">
                    <h3 className="text-lg font-medium">2022</h3>
                    <h4 className="text-md font-medium">
                      Completed Angela Yu’s 100 Days of Code Bootcamp
                    </h4>
                    <p className="text-sm">
                      1. Built 20+ web projects including REST APIs,
                      authentication flows, and UI/UX clones.
                      <br />
                      2. Mastered Node.js, Express, EJS, MongoDB, and deployment
                      techniques via hands-on projects.
                      <br />
                      3. Strengthened full-stack logic and version control
                      through daily Git & GitHub workflow.
                    </p>
                  </div>

                  {/* iOS & Flutter Dev */}
                  <div className="flex flex-col space-y-2">
                    <h3 className="text-lg font-medium">2022 - 2023</h3>
                    <h4 className="text-md font-medium">
                      iOS & Cross-Platform Mobile Developer
                    </h4>
                    <p className="text-sm">
                      1. Built and deployed iOS apps with Swift & SwiftUI during
                      Apple dev practice sessions.
                      <br />
                      2. Developed Flutter apps integrating Firebase, REST APIs,
                      and UI state management.
                      <br />
                      3. Created smart home UI and productivity tools as part of
                      mobile prototype development.
                    </p>
                  </div>

                  {/* Cybersecurity Research */}
                  <div className="flex flex-col space-y-2">
                    <h3 className="text-lg font-medium">2023 - Present</h3>
                    <h4 className="text-md font-medium">
                      Cybersecurity Analyst & CISO (Research-based)
                    </h4>
                    <p className="text-sm">
                      1. Investigated dark web scams, SIM swapping, phishing,
                      and Office365 spoofing.
                      <br />
                      2. Conducted research on AI-based impersonation threats
                      and developed POCs.
                      <br />
                      3. Proposed face/voice verification systems for secure
                      video communication.
                    </p>
                  </div>

                  {/* Community Contributions */}
                  <div className="flex flex-col space-y-2">
                    <h3 className="text-lg font-medium">2023 - Present</h3>
                    <h4 className="text-md font-medium">
                      Mentor, Trainer & Open-Source Contributor
                    </h4>
                    <p className="text-sm">
                      1. Mentored junior devs in full-stack JavaScript and
                      deployment practices.
                      <br />
                      2. Contributed to open-source projects with clean
                      architecture and reusable components.
                      <br />
                      3. Wrote dev-focused tutorials and walkthroughs to help
                      learners grow.
                    </p>
                  </div>
                </div>
              </section>
            </div>
          </AnimatedItem>
        </div>
      </div>
    </div>
  );
};

export default Experience;
