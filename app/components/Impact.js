import React from "react";
import AnimatedItem from "./AnimatedItem";
import { MdOutlineClose } from "react-icons/md";

const Impact = ({ impact, setImpact }) => {
  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center overflow-auto bg-black bg-opacity-50 transition-opacity ${
        impact ? "opacity-100 visible" : "opacity-0 invisible"
      }`}
    >
      <div className="bg-opacity-100 backdrop-blur-3xl border border-gray-400 w-[1000px] h-[500px] overflow-y-scroll p-1 rounded-lg shadow-xl border-opacity-10">
        <div className="flex">
          <MdOutlineClose
            className="text-white text-4xl ml-auto p-1 hover:bg-red-600 rounded-tr-md rounded-br-md"
            onClick={() => {
              const audio = new Audio("click.wav");
              audio.play();
              setImpact(false);
            }}
          />
        </div>

        <div className="flex flex-col items-start justify-start p-5">
          <AnimatedItem animationConfig={{ delay: 0.1 }}>
            <div className="flex flex-col w-full">
              <h1 className="text-4xl font-medium text-white border-b-2 pb-2 mb-4 border-gray-400 border-opacity-10 w-full">
                Impact
              </h1>
              <section className="mt-2 text-white">
                <div className="container space-y-6">
                  {/* Google Developer Students Club (GDSC) Lead */}
                  <div className="flex flex-col space-y-2">
                    <h3 className="text-lg font-medium">
                      Google Developer Students Club (GDSC)
                    </h3>
                    <h4 className="text-md font-medium">Lead & Mentor</h4>
                    <p className="text-sm font-light">
                      Led and mentored 130+ developers, organizing hands-on
                      workshops in full-stack development, empowering new talent
                      with real-world skills.
                      <br />
                      Guided teams that built mobile apps for Google Solution
                      Challenge 2023, fostering innovation and collaboration.
                    </p>
                  </div>

                  {/* Altschool & Angela Yu 100 Days of Code */}
                  <div className="flex flex-col space-y-2">
                    <h3 className="text-lg font-medium">
                      Altschool Africa & Angela Yu 100 Days of Code
                    </h3>
                    <h4 className="text-md font-medium">
                      Student & Self-Driven Developer
                    </h4>
                    <p className="text-sm font-light">
                      Completed Altschool Africa’s comprehensive full-stack
                      development program, gaining expertise in React, Node.js,
                      API development, and deployment.
                      <br />
                      Finished Angela Yu’s 100 Days of Code iOS course, building
                      native iOS apps and strengthening mobile development
                      skills.
                      <br />
                      Applied practical skills by developing real-world
                      projects, consistently growing through daily coding
                      challenges and hands-on learning.
                    </p>
                  </div>

                  {/* Smart Home & IoT Development */}
                  <div className="flex flex-col space-y-2">
                    <h3 className="text-lg font-medium">
                      Smart Home & IoT Solutions
                    </h3>
                    <h4 className="text-md font-medium">
                      Developer & Innovator
                    </h4>
                    <p className="text-sm font-light">
                      Designed and built smart home devices integrating sensors,
                      automation, and cloud connectivity using Node.js and
                      JavaScript.
                      <br />
                      Delivered secure IoT solutions enabling remote control and
                      real-time monitoring for enhanced home convenience.
                    </p>
                  </div>

                  {/* Cybersecurity Research & Advocacy */}
                  <div className="flex flex-col space-y-2">
                    <h3 className="text-lg font-medium">
                      Cybersecurity Research & Advocacy
                    </h3>
                    <h4 className="text-md font-medium">
                      Researcher & Educator
                    </h4>
                    <p className="text-sm font-light">
                      Investigated emerging cyber threats including SIM
                      swapping, Office 365 scams, and AI-powered identity
                      spoofing.
                      <br />
                      Developed educational content and proof-of-concept tools
                      to raise awareness and strengthen defenses against
                      evolving attacks.
                    </p>
                  </div>

                  {/* Mentorship & Community Building */}
                  <div className="flex flex-col space-y-2">
                    <h3 className="text-lg font-medium">
                      Mentorship & Community
                    </h3>
                    <h4 className="text-md font-medium">Mentor & Trainer</h4>
                    <p className="text-sm font-light">
                      Guided junior developers on full-stack JavaScript,
                      authentication, API security, and scalable app
                      architecture.
                      <br />
                      Contributed open-source projects and shared knowledge
                      through blogs, tutorials, and workshops to foster
                      continuous learning.
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

export default Impact;
