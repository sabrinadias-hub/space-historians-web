// English text for the story. Only text lives here: structure (order, positions,
// correct answers, rewards, simulations) comes from story-data.ts, so both languages stay in sync.
// Options, pairs and sequences must keep the same order as the Portuguese version.
import type { StoryText } from './story-data';

export const storyEn: StoryText = {
  prologue: {
    eyebrow: 'PROLOGUE · AN ARCHIVE FULL OF QUESTIONS',
    title: 'The stories that stayed on the Moon',
    paragraphs: [
      'The lunar surface fills your spacecraft window. There are craters, rocks and long shadows. On the map, small dots mark the places you can explore.',
      'You open your digital backpack. The Space Historians archive appears with twelve files, all still incomplete.',
      'Equipment holds stories. To uncover them, observe, experiment with the simulations and look for evidence.',
    ],
    mission: 'Find the equipment and discover how each piece helped people understand the Moon better.',
  },
  discoveries: [
    {
      title: 'Apollo 12 ALSEP',
      subtitle: 'The ground kept the departure',
      location: 'Oceanus Procellarum',
      route: { label: 'Lunar Station', detail: 'Apollo 12' },
      objective: 'Find the lunar station',
      teaser: 'Follow the glowing signal. A laboratory left on the Moon still has a story to tell.',
      encounter: [
        'An antenna stands out in Oceanus Procellarum. Cables connect the central station to instruments spread across the ground.',
        'You open the file. A record full of small wiggles appears on the screen.',
        'Why did the ground move? The answer may lie with a spacecraft that has already left.',
      ],
      steps: [
        {
          title: 'A science station',
          paragraphs: [
            'You found the Apollo 12 ALSEP, a science station set up in 1969.',
            'It gathered instruments to study the Moon, including a seismometer, which recorded ground vibrations. Its antenna sent measurements to Earth.',
            'After the astronauts left, the station kept sending information.',
          ],
          activity: {
            prompt: 'Which instrument recorded the ground vibrations?',
            options: ['Seismometer', 'Camera', 'Dish antenna'],
            success: 'Discovery recorded: a station could keep doing research with no people around.',
            hint: 'Clue: read the text again and look for the instrument that recorded ground vibrations.',
          },
        },
        {
          title: 'The ground recorded the impact',
          paragraphs: [
            'The seismometer sensed vibrations from the liftoff of Intrepid. Later, for almost an hour, it recorded the vibrations from the planned impact of its empty ascent stage.',
          ],
          activity: {
            prompt: 'Which record shows vibrations that continue after the impact?',
            options: ['━━━ almost still line', '〰〰〰 long-lasting wiggles'],
            success: 'The wiggles appear. You found the trace left by the event!',
            hint: 'Clue: after the impact, the ground kept shaking for almost an hour. Which record shows movement that continues?',
          },
        },
        {
          title: 'Records that confirm each other',
          paragraphs: [
            'Mission records document the impact. Seismometer data show the vibrations. Linking the two helped scientists interpret the signal and test the instrument.',
          ],
          activity: {
            prompt: 'Which two pieces of evidence need to be linked?',
            options: ['Impact record + seismic signal', 'Photograph + wheel track', 'Map + rock sample'],
            success: 'Your file is complete. The module left, but the ground kept its trace.',
            hint: 'Clue: the text mentions two records that confirm each other: one from the mission and one from the seismometer.',
          },
        },
      ],
      facts: 'Set up in 1969, instruments, data transmission and records of the liftoff and impact. File sources: NASA and ALSEP studies.',
      fiction: 'Route, simplified records, challenge, backpack and points.',
    },
    {
      title: 'Surveyor 3',
      subtitle: 'The visit that left clues',
      location: 'Ocean of Storms',
      route: { label: 'Surveyor 3', detail: 'robotic probe' },
      objective: 'Find the probe inside the crater',
      teaser: 'A three-legged structure waits inside a crater. Some parts seem to be missing.',
      encounter: [
        'Inside a crater, you find a three-legged structure. In the historical image opened by your backpack, it looks more complete.',
        'You place the two images side by side. Some parts are missing.',
        'Did someone come here after the landing?',
      ],
      steps: [
        {
          title: 'A robot before the astronauts',
          paragraphs: [
            'This is Surveyor 3, a NASA robotic probe that landed in 1967 in the Ocean of Storms.',
            'It studied the surface before the first astronauts set foot on the Moon.',
            'Its landing had a surprise: the probe bounced twice before stopping!',
          ],
          activity: {
            prompt: 'Who explored this ground before the astronauts?',
            options: ['A robotic probe', 'A lunar car', 'A station with an antenna'],
            success: 'Discovery recorded: a robot explored this ground before the astronauts.',
            hint: 'Clue: Surveyor 3 landed in 1967, two years before Apollo 12 arrived.',
          },
        },
        {
          title: 'Images, a scoop and a visit',
          paragraphs: [
            'Its camera took more than six thousand images. A small scoop tested how firm the soil was, helping to check whether it could hold a lunar module.',
            'In 1969, Apollo 12 astronauts visited the probe and brought back parts of it.',
          ],
          activity: {
            prompt: 'Compare the images. Which parts were brought back during the 1969 visit?',
            options: ['The camera and the scoop', 'The three legs', 'The whole crater'],
            success: 'The differences start to make sense.',
            hint: 'Clue: the legs are still in the crater. Look for the parts that disappeared from the current image.',
          },
        },
        {
          title: 'Three pieces of evidence, one mystery',
          paragraphs: [
            'Apollo 12 records document the visit. The parts taken to Earth allowed scientists to study the effects of the lunar environment. Orbital images help locate the structure that remains.',
          ],
          activity: {
            prompt: 'Match each clue to its evidence.',
            pairs: [
              { item: 'The visit', answer: 'Apollo 12 records' },
              { item: 'Studying the parts', answer: 'Parts taken to Earth' },
              { item: 'The location', answer: 'Orbital images' },
            ],
            success: 'You solved the mystery. Your backpack keeps the discoveries; Surveyor stays in the crater.',
            hint: 'Clue: read the text again. Each piece of evidence answers a different question.',
          },
        },
      ],
      facts: 'Landing and bounces, camera, scoop, the Apollo 12 visit and recovered parts. File sources: NASA and NSSDCA.',
      fiction: 'Mystery, interactive comparison and points.',
    },
    {
      title: 'Apollo 14 ALSEP',
      subtitle: 'A question beneath your feet',
      location: 'Fra Mauro',
      route: { label: 'Lunar Station', detail: 'Apollo 14' },
      objective: 'Follow the station cables at Fra Mauro',
      teaser: 'At Fra Mauro, cables lead to a station that studied what cannot be seen.',
      encounter: [
        'At Fra Mauro, you follow the cables of a science station.',
        'Your backpack shows a drawing of the ground. Below the surface, an area is covered by a question mark.',
        'How can you learn about a place you cannot see?',
      ],
      steps: [
        {
          title: 'A station that uses vibrations',
          paragraphs: [
            'This is the Apollo 14 ALSEP, set up in 1971.',
            'It arrived on the lunar module Antares. Its instruments were prepared to carry out research and send measurements to Earth after the crew left.',
            'Among them was an active seismic experiment.',
          ],
          activity: {
            prompt: 'Which experiment was part of this station?',
            options: ['An active seismic experiment', 'A laser reflector', 'A lunar car'],
            success: 'Discovery recorded: this station studied the ground using vibrations.',
            hint: 'Clue: the last paragraph says which experiment was among the instruments.',
          },
        },
        {
          title: 'A clue travels through the ground',
          paragraphs: [
            'The experiment made vibrations on the surface. Sensors recorded the signals that passed through the ground, helping to study its shallow layers.',
            'In the simulation, a sensor is waiting for the signal.',
          ],
          activity: {
            prompt: 'Make a virtual vibration and watch when it shows up in the sensor record.',
            success: 'The mark appears on the screen. A clue traveled through the ground!',
          },
        },
        {
          title: 'From vibration to discovery',
          paragraphs: [
            'Researchers knew where the vibrations came from and studied the signals they received. Instrument documents and research on the results explain this investigation.',
          ],
          activity: {
            prompt: 'Tap the steps in the right order.',
            sequence: ['Make the vibration', 'Record the signal', 'Study the data'],
            success: 'The question mark becomes a discovery: movements recorded on the surface helped investigate what lay beneath it.',
            hint: 'Clue: first something has to happen in the ground; only then is there a signal to study.',
          },
        },
      ],
      facts: 'Setup, transport on Antares and the active seismic experiment. File sources: NASA and experiment studies.',
      fiction: 'Illustration, interactive sequence and simulated signals.',
    },
    {
      title: 'Apollo 15 ALSEP',
      subtitle: 'The invisible clue',
      location: 'Hadley–Apennine',
      route: { label: 'Lunar Station', detail: 'Apollo 15' },
      objective: 'Find the Hadley–Apennine station',
      teaser: 'Find a clue that does not show up in a photograph.',
      encounter: [
        'You arrive at the Hadley–Apennine station. An antenna, cables and instruments appear on the ground.',
        'The backpack challenge is short: “Find a clue that does not show up in a photograph.”',
        'You look again. Maybe you need to look in a different way.',
      ],
      steps: [
        {
          title: 'Heat from inside',
          paragraphs: [
            'This is the Apollo 15 ALSEP, set up in 1971.',
            'It arrived on the lunar module Falcon and gathered instruments to study the Moon. Among them were a seismometer and a heat flow experiment.',
            'The clue you are looking for is in the temperature measurements.',
          ],
          activity: {
            prompt: 'Where is the clue that does not show up in the photograph?',
            options: ['In the temperature measurements', 'In the color of the rocks', 'In the shape of the antenna'],
            success: 'Discovery recorded: the inside of the Moon could also be studied through heat.',
            hint: 'Clue: the last paragraph tells you where the clue is.',
          },
        },
        {
          title: 'Sensors at two depths',
          paragraphs: [
            'Sensors helped estimate how much heat was escaping from the inside of the Moon in that region.',
            'In the simulation, you see the soil with sensors at two depths.',
          ],
          activity: {
            prompt: 'Compare the simulated temperatures. What do you notice?',
            options: [
              'The deeper sensor shows a higher temperature',
              'Both sensors show exactly the same',
              'The shallower sensor is the warmest',
            ],
            success: 'The readings sit side by side. You found information that the landscape did not reveal.',
            hint: 'Clue: compare the two numbers. Which sensor is closer to the inside of the Moon?',
          },
        },
        {
          title: 'The right evidence',
          paragraphs: [
            'Scientists studied the sensor measurements to estimate how heat moves through the ground. The file points to studies of the instruments and their results.',
          ],
          activity: {
            prompt: 'Which evidence supports this discovery?',
            options: ['The temperature data from the sensors', 'A photograph of the landscape'],
            success: 'You chose the measurements. The invisible clue is now part of your archive.',
            hint: 'Clue: remember the challenge: the clue does not show up in a photograph.',
          },
        },
      ],
      facts: 'Setup, transport on Falcon and the study of internal heat. File sources: NASA and a scientific study.',
      fiction: 'Challenge, soil cross-section and illustrative temperatures.',
    },
    {
      title: 'Apollo 15 Rover',
      subtitle: 'The car that had to fit',
      location: 'Hadley–Apennine',
      route: { label: 'Rover', detail: 'Apollo 15' },
      objective: 'Follow the wheel tracks',
      teaser: 'Wheel tracks lead to a parked car. How did it fit inside the spacecraft?',
      encounter: [
        'Wheel tracks lead you to a parked car.',
        'Your backpack shows the vehicle and the compartment of Falcon. You compare their sizes.',
        'There is a curious problem to solve: how did that car travel inside the spacecraft?',
      ],
      steps: [
        {
          title: 'The first car on the Moon',
          paragraphs: [
            'This is the Apollo 15 Lunar Roving Vehicle, from 1971: the first car driven on the Moon.',
            'It had two seats and four wire-mesh wheels. It carried astronauts, tools and samples around the Hadley–Apennine region.',
          ],
          activity: {
            prompt: 'What did the rover carry?',
            options: ['Astronauts, tools and samples', 'Fuel for the spacecraft', 'Water for a base'],
            success: 'Discovery recorded: exploring the Moon also gained paths on wheels.',
            hint: 'Clue: the second paragraph lists what it carried.',
          },
        },
        {
          title: 'Traveling folded',
          paragraphs: [
            'The rover took the crew to the edge of Hadley Rille to observe the terrain and collect samples. It traveled 27.9 kilometers during the mission.',
            'The secret to transporting it was traveling folded!',
          ],
          activity: {
            prompt: 'Drive the virtual copy of the rover to the sampling station.',
            stops: ['Module', 'Crater', 'Hadley Rille'],
            success: 'Now you understand how it fit and why it was useful.',
          },
        },
        {
          title: 'Three questions, three pieces of evidence',
          paragraphs: [
            'NASA documents describe how the car was transported and unfolded. Records give the distance traveled, and orbital images show where it was parked.',
          ],
          activity: {
            prompt: 'Match each question to its evidence.',
            pairs: [
              { item: 'How it arrived', answer: 'Documents about the transport' },
              { item: 'How far it went', answer: 'Distance records' },
              { item: 'Where it stayed', answer: 'Orbital images' },
            ],
            success: 'You return to the view of the vehicle. It is still parked, but your file now tells the story of a journey.',
            hint: 'Clue: an image taken from above shows a place; records show numbers.',
          },
        },
      ],
      facts: 'First lunar car, folded transport, Hadley Rille and a 27.9 km route. File sources: NASA, NSSDC and LROC.',
      fiction: 'Drivable copy, route and evidence matching.',
    },
    {
      title: 'Apollo 16 ALSEP',
      subtitle: 'The blank space',
      location: 'Descartes Highlands',
      route: { label: 'Lunar Station', detail: 'Apollo 16' },
      objective: 'Find the Descartes station',
      teaser: 'A file with a blank space. Why is a measurement missing?',
      encounter: [
        'In the Descartes highlands, you find another station.',
        'Your backpack opens two fields: vibrations and heat. The first has data; the second, a historical note.',
        'Why does that space show no measurement?',
      ],
      steps: [
        {
          title: 'Research in one place',
          paragraphs: [
            'This is the Apollo 16 ALSEP, set up in 1972.',
            'It arrived on the lunar module Orion. The set included a central station, an antenna and instruments connected by cables, with seismic and heat flow experiments.',
          ],
          activity: {
            prompt: 'Which experiments did this set include?',
            options: ['Seismic and heat flow', 'Only a camera', 'A laser reflector'],
            success: 'Discovery recorded: one station brought different kinds of research to the same place.',
            hint: 'Clue: the end of the second paragraph names the experiments.',
          },
        },
        {
          title: 'Who got it first?',
          paragraphs: [
            'The active seismic experiment helped study the shallow layers of the ground.',
            'In the simulation, sensors receive a vibration at different moments.',
          ],
          activity: {
            prompt: 'Compare the records. Which sensor received the signal first?',
            options: ['Sensor 1, the closest', 'Sensor 2', 'Sensor 3, the farthest'],
            success: 'You saved the observation. The heat field is still unexplained: to understand it, check what happened during setup.',
            hint: 'Clue: the vibration starts at one point and travels through the ground. Which sensor does it reach first?',
          },
        },
        {
          title: 'Recording what went wrong',
          paragraphs: [
            'Mission documents record that a cable of the heat experiment broke during setup. That experiment was lost.',
          ],
          activity: {
            prompt: 'How should the heat field be completed?',
            options: ['“Experiment lost”, according to the historical record', 'Make up any temperature', 'Delete the field from the file'],
            success: 'The blank space now has an explanation. You learned that research also needs to record problems and acknowledge the results it could not obtain.',
            hint: 'Clue: the historical record tells what happened to the cable.',
          },
        },
      ],
      facts: 'Setup, seismic study and loss of the heat experiment. File sources: NASA and instrument studies.',
      fiction: 'Digital fields, signal comparison and challenge.',
    },
    {
      title: 'Apollo 16 Rover',
      subtitle: 'The camera that stayed',
      location: 'Descartes',
      route: { label: 'Rover', detail: 'Apollo 16' },
      objective: 'Follow the wheel tracks at Descartes',
      teaser: '“It had a view of a departure.” Which departure?',
      encounter: [
        'You follow wheel tracks at Descartes until you find a parked vehicle.',
        'The camera is highlighted on the panel. A sentence appears: “It had a view of a departure.”',
        'Which departure? Open the file to investigate.',
      ],
      steps: [
        {
          title: 'An electric car on the Moon',
          paragraphs: [
            'This is the Apollo 16 rover, used by John Young and Charles Duke in 1972.',
            'The electric car had four wheels and two seats. It traveled folded inside Orion and was unfolded on the lunar surface.',
          ],
          activity: {
            prompt: 'How did the rover travel to the Moon?',
            options: ['Folded, inside Orion', 'Assembled, attached to the outside', 'On a rocket of its own'],
            success: 'Discovery recorded: the car helped carry people, tools and samples.',
            hint: 'Clue: the second paragraph tells how it traveled.',
          },
        },
        {
          title: 'To North Ray',
          paragraphs: [
            'The rover widened the area the crew could explore. It took the astronauts to North Ray Crater, where they collected samples around House Rock.',
          ],
          activity: {
            prompt: 'Drive the virtual copy along the route to the sampling station.',
            stops: ['Module', 'North Ray', 'House Rock'],
            success: 'You open the camera clue: it had a view of the liftoff of Orion. The car stayed while the crew left.',
          },
        },
        {
          title: 'One last look',
          paragraphs: [
            'The NASA document listed in the file records that the liftoff happened in view of the camera. Orbital images help identify where it was finally parked.',
          ],
          activity: {
            prompt: 'Match each clue to its evidence.',
            pairs: [
              { item: 'The liftoff seen by the camera', answer: 'NASA document' },
              { item: 'The final parking spot', answer: 'Orbital image' },
            ],
            success: 'You solved the clue. That car’s camera was part of a last look at the departure.',
            hint: 'Clue: an image taken from orbit shows where the car is.',
          },
        },
      ],
      facts: 'Crew, transport, sampling sites and a camera with a view of the liftoff. File sources: NASA, NSSDC and LROC.',
      fiction: 'Camera highlight, virtual route and challenge.',
    },
    {
      title: 'Apollo 11 Laser Reflector',
      subtitle: 'A message of light',
      location: 'Sea of Tranquility',
      route: { label: 'Reflector', detail: 'Apollo 11' },
      objective: 'Find the small panel',
      teaser: 'A small panel helps measure an enormous distance.',
      encounter: [
        'Near the base of Eagle, a small panel catches your eye.',
        'It looks simple next to the huge landscape.',
        'Your backpack shows the challenge: “Find out how this object helps measure a distance between Earth and the Moon.”',
      ],
      steps: [
        {
          title: 'A panel that sends light back',
          paragraphs: [
            'This is the Apollo 11 laser reflector, set up in 1969.',
            'The panel has one hundred silica elements that send part of the light back in the direction it came from. It does this without producing any energy of its own.',
          ],
          activity: {
            prompt: 'What does the panel do with the light it receives?',
            options: ['Sends part of it back where it came from', 'Stores the light like a battery', 'Produces its own light'],
            success: 'Discovery recorded: a panel can send back light received from Earth.',
            hint: 'Clue: the panel works without producing its own energy.',
          },
        },
        {
          title: 'Light there and back',
          paragraphs: [
            'Observatories on Earth send laser pulses to the reflector. Part of the light comes back.',
            'Send a pulse in the simulator and follow its round-trip time.',
          ],
          activity: {
            prompt: 'What does this time interval help us find out?',
            options: ['The distance between Earth and the Moon', 'The temperature of the Moon', 'The size of the panel'],
            success: 'A line of light traced the path, and the time appeared on the panel. That interval holds a distance!',
            hint: 'Clue: light always travels at the same speed. The farther away, the longer it takes.',
          },
        },
        {
          title: 'Time becomes distance',
          paragraphs: [
            'By measuring how long the light takes, scientists calculate the distance between the observatory and the reflector. The measurements help track changes in the Earth–Moon distance.',
          ],
          activity: {
            prompt: 'Match each measurement to what it helps discover.',
            pairs: [
              { item: 'Round-trip time of the pulse', answer: 'Calculating the distance' },
              { item: 'Measurements repeated over the years', answer: 'Changes in the Earth–Moon distance' },
            ],
            success: 'You found the secret. The panel stayed on the Moon, but its usefulness reaches observatories on Earth.',
            hint: 'Clue: a single time gives a distance; many measurements show changes.',
          },
        },
      ],
      facts: 'Setup, one hundred elements, how it works and the measuring method. File sources: ILRS and Apollo 11 documents.',
      fiction: 'Controllable laser, visible beam and illustrative time.',
    },
    {
      title: 'The Eagle’s Base',
      subtitle: 'The incomplete spacecraft',
      location: 'Sea of Tranquility',
      route: { label: 'Eagle’s Base', detail: 'Apollo 11' },
      objective: 'Find the base of Eagle',
      teaser: 'Four legs, a ladder and a plaque. But the spacecraft looks incomplete.',
      encounter: [
        'You spot a shadow in the orbital image. The reconstruction shows four legs, a ladder and a plaque.',
        'But the spacecraft looks incomplete.',
        'You check the archive. The missing part is exactly the clue to understanding what happened.',
      ],
      steps: [
        {
          title: 'The bottom part of the module',
          paragraphs: [
            'This is the descent stage of Eagle, the Apollo 11 lunar module.',
            'It landed with Neil Armstrong and Buzz Aldrin on July 20, 1969. It had an engine to slow the descent, four legs and a ladder.',
          ],
          activity: {
            prompt: 'Which part of Eagle stayed on the Moon?',
            options: ['The descent stage, the bottom part', 'The astronauts’ cabin', 'The whole module'],
            success: 'Discovery recorded: this structure was the lower part of the module.',
            hint: 'Clue: the spacecraft looks incomplete. Think about which part took the astronauts away.',
          },
        },
        {
          title: 'The cabin leaves, the base stays',
          paragraphs: [
            'The base helped with the landing and served as a launch pad for liftoff. The upper part took the astronauts back to orbit to meet Columbia.',
          ],
          activity: {
            prompt: 'Tap the cabin on the virtual model and watch the stages separate.',
            success: 'The cabin leaves in the animation. The base stays. Now the incomplete shape makes sense.',
          },
        },
        {
          title: 'A discovery and an uncertainty',
          paragraphs: [
            'Mission documents describe the separation. An orbital image listed in the file shows the base on the surface.',
            'The final fate of the ascent stage has not been confirmed.',
          ],
          activity: {
            prompt: 'Match each part to what we know about it.',
            pairs: [
              { item: 'The base on the surface', answer: 'Seen in an orbital image' },
              { item: 'The final fate of the ascent stage', answer: 'Unknown: not confirmed' },
            ],
            success: 'Your investigation records both the discovery and the uncertainty that remains.',
            hint: 'Clue: the text clearly says what was not confirmed.',
          },
        },
      ],
      facts: 'Landing, stages, the base that stayed and the unconfirmed final fate of the ascent stage. Sources: documents and orbital image listed in the file.',
      fiction: 'Guided search and animated model.',
    },
    {
      title: 'Apollo 11 PSEP',
      subtitle: 'The other trace of a step',
      location: 'Sea of Tranquility',
      route: { label: 'PSEP', detail: 'Apollo 11' },
      objective: 'Follow the footprints to the device',
      teaser: 'Besides the mark in the dust, what other clue can a step leave?',
      encounter: [
        'Footprints lead you to a device with two solar panels.',
        'Your backpack asks a question: “Besides the mark in the dust, what other clue can a step leave?”',
        'The answer is in that piece of equipment.',
      ],
      steps: [
        {
          title: 'Sun-powered seismometers',
          paragraphs: [
            'This is the Apollo 11 PSEP, set up on July 21, 1969.',
            'The set had four seismometers, an antenna and two solar panels. Seismometers record ground vibrations.',
          ],
          activity: {
            prompt: 'What do seismometers record?',
            options: ['Ground vibrations', 'Sunlight', 'Air temperature'],
            success: 'Discovery recorded: ground movements can become data.',
            hint: 'Clue: the last sentence of the text explains it.',
          },
        },
        {
          title: 'A step on the graph',
          paragraphs: [
            'The PSEP recorded vibrations from the astronauts’ steps and from the crew moving inside Eagle.',
            'Make the character in the simulation take a step and watch the graph.',
          ],
          activity: {
            prompt: 'What does the wiggle on the graph represent?',
            options: ['The vibration caused by the step', 'The footprint in the dust', 'Wind on the Moon'],
            success: 'A wiggle appeared. The footprint shows where the step was; the record represents its vibration.',
            hint: 'Clue: there is no wind on the Moon. The instrument feels the ground shake.',
          },
        },
        {
          title: 'Signals with an explanation',
          paragraphs: [
            'Mission reports document the signals. Scientists were able to link some of them to known crew activities.',
          ],
          activity: {
            prompt: 'Match each trace to where it appears.',
            pairs: [
              { item: 'The vibration of the step', answer: 'Signal on the seismometer' },
              { item: 'Where the step happened', answer: 'Footprint in the dust' },
            ],
            success: 'You found the other trace of a step. One clue stayed in the dust; the other could be recorded by an instrument.',
            hint: 'Clue: one clue is seen on the ground; the other only appears on the instrument.',
          },
        },
      ],
      facts: 'Setup, components and records of steps and movements. File sources: scientific and Apollo 11 mission reports.',
      fiction: 'Simulation character, graph and colored waves.',
    },
    {
      title: 'Apollo 17 ALSEP',
      subtitle: 'A discovery without a tunnel',
      location: 'Taurus–Littrow',
      route: { label: 'Lunar Station', detail: 'Apollo 17' },
      objective: 'Find the Taurus–Littrow station',
      teaser: 'How can you study rocks that are far below you?',
      encounter: [
        'At Taurus–Littrow, you find a science station.',
        'On the panel, an arrow points below the surface. There is no tunnel or passage.',
        'How can you study rocks that are far below where you stand?',
      ],
      steps: [
        {
          title: 'Waves that investigate',
          paragraphs: [
            'This is the Apollo 17 ALSEP, switched on in December 1972.',
            'It arrived on the lunar module Challenger. Its instruments were set up to take measurements and send the data to Earth.',
            'Among them was a seismic profiling experiment.',
          ],
          activity: {
            prompt: 'Which experiment helped study the inside of the Moon?',
            options: ['A seismic profiling experiment', 'A television camera', 'A reflector panel'],
            success: 'Discovery recorded: waves could help study the inside of the Moon.',
            hint: 'Clue: the last paragraph names the experiment.',
          },
        },
        {
          title: 'Three kilometers down',
          paragraphs: [
            'The waves recorded by the experiment helped study the lunar crust down to about three kilometers deep in that region.',
          ],
          activity: {
            prompt: 'Compare the sensor signals. What happens at the farther sensors?',
            options: ['The signal arrives later', 'The signal arrives earlier', 'Nothing changes'],
            success: 'A drawing of the underground opens. It represents the region studied and helps you follow the explanation.',
            hint: 'Clue: the wave has to travel farther to reach the distant sensors.',
          },
        },
        {
          title: 'Evidence or illustration?',
          paragraphs: [
            'Researchers studied the wave records to investigate the structures below the surface. The studies listed in the file explain these results.',
          ],
          activity: {
            prompt: 'What is the evidence for this discovery?',
            options: ['The sensor records', 'The underground drawing made for the game'],
            success: 'You completed the discovery. The investigation reached depths the astronauts never had to visit: the way there was in the signals.',
            hint: 'Clue: the drawing only helps explain; the data came from the instruments.',
          },
        },
      ],
      facts: 'Activation, transport and seismic study down to about 3 km in the region. File sources: NASA and a scientific study.',
      fiction: 'Challenge, simplified signals and underground illustration.',
    },
    {
      title: 'Apollo 17 Rover',
      subtitle: 'The detail near the wheel',
      location: 'Taurus–Littrow',
      route: { label: 'Rover', detail: 'Apollo 17' },
      objective: 'Follow the wheel tracks',
      teaser: 'A small detail near the wheel deserves a page in history.',
      encounter: [
        'You follow wheel tracks to a parked car.',
        'The archive highlights a small area near the wheel. Next to a whole vehicle, that detail seems minor.',
        'Why does it deserve a page in the history of the mission?',
      ],
      steps: [
        {
          title: 'The last rover',
          paragraphs: [
            'This is the Apollo 17 rover, used in 1972 by Eugene Cernan and Harrison Schmitt.',
            'The electric car had four wheels and two seats. It carried astronauts, tools and samples around Taurus–Littrow.',
          ],
          activity: {
            prompt: 'Who used this rover?',
            options: ['Eugene Cernan and Harrison Schmitt', 'Neil Armstrong and Buzz Aldrin', 'John Young and Charles Duke'],
            success: 'Discovery recorded: the vehicle extended how far the explorers could travel.',
            hint: 'Clue: the first paragraph has the names of the crew.',
          },
        },
        {
          title: '35.7 km and a fender',
          paragraphs: [
            'The rover traveled 35.7 kilometers during the mission. It traveled folded inside Challenger.',
          ],
          activity: {
            prompt: 'Open the virtual copy and drive the route shown in the simulator.',
            stops: ['Module', 'Shorty Crater', 'Sampling station'],
            success: 'When you finish, you check the detail: a fender extension came off. A wheel started throwing dust over the crew and the car. A small part made a difference to the work.',
          },
        },
        {
          title: 'How far and what went wrong',
          paragraphs: [
            'The mission summary listed in the file records both the distance traveled and the fender episode.',
          ],
          activity: {
            prompt: 'Where are the distance and the fender episode recorded?',
            options: ['In the mission summary', 'Only in a painting', 'In no record at all'],
            success: 'You completed the file. It now tells how far the journey went and a difficulty met along the way. The rover stays on the surface; its story goes on with you.',
            hint: 'Clue: the text says which document records both pieces of information.',
          },
        },
      ],
      facts: 'Crew, folded transport, a 35.7 km route and the fender episode. File sources: NASA and NSSDC.',
      fiction: 'Visual highlight, drivable copy and route.',
    },
  ],
  epilogue: {
    eyebrow: 'EPILOGUE · WHAT YOU TAKE FROM THE MOON',
    title: 'Lunar archive complete',
    paragraphs: [
      'The spaces that once held questions now hold discoveries: a probe visited years after it landed, cars that traveled folded, instruments that recorded footsteps and waves that helped study what lies underground.',
      'You learned to look for different kinds of evidence: images, measurements, studied parts and mission documents. You also found a piece of information that is still unknown and an experiment that could not produce the expected results.',
    ],
    distinction: 'Historian of the Moon',
    favoritePrompt: 'Choose your favorite discovery to mark in your digital journal.',
    closing: 'You did not bring any object back. You brought ways of understanding their stories.',
  },
};
