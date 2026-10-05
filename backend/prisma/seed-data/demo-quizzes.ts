import { Audience, Difficulty, QuizLanguage, QuizTheme } from '@prisma/client';

interface SeedQuestion {
  text: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  hint: string;
}

export interface SeedQuiz {
  id: string;
  title: string;
  topic: string;
  theme: QuizTheme;
  difficulty: Difficulty;
  audience: Audience;
  language: QuizLanguage;
  timePerQuestion: number;
  questions: SeedQuestion[];
}

const solarSystem: SeedQuiz = {
  id: 'seed-quiz-solar-system',
  title: 'The Solar System',
  topic: 'The Solar System',
  theme: 'SPACE',
  difficulty: 'EASY',
  audience: 'KIDS',
  language: 'EN',
  timePerQuestion: 45,
  questions: [
    {
      text: 'Which planet is closest to the Sun?',
      options: ['Mercury', 'Venus', 'Earth', 'Mars'],
      correctIndex: 0,
      explanation: 'Mercury is the closest planet to the Sun. It races around it in just 88 days.',
      hint: 'It is also the smallest of the eight planets.',
    },
    {
      text: 'What is the largest planet in our Solar System?',
      options: ['Saturn', 'Jupiter', 'Neptune', 'Earth'],
      correctIndex: 1,
      explanation: 'Jupiter is the biggest planet. More than 1,300 Earths could fit inside it.',
      hint: 'This giant has a huge storm called the Great Red Spot.',
    },
    {
      text: 'Which planet is called the Red Planet?',
      options: ['Venus', 'Jupiter', 'Mars', 'Mercury'],
      correctIndex: 2,
      explanation: 'Mars looks red because its dust and rocks contain a lot of rusty iron.',
      hint: 'Robots called rovers are driving around on this planet right now.',
    },
    {
      text: 'What is the Sun?',
      options: ['A planet', 'A moon', 'A comet', 'A star'],
      correctIndex: 3,
      explanation:
        'The Sun is a star: a giant ball of hot, glowing gas. It is the closest star to Earth.',
      hint: 'At night you can see many faraway things like it twinkling in the sky.',
    },
    {
      text: 'How many planets are in our Solar System?',
      options: ['Eight', 'Seven', 'Nine', 'Ten'],
      correctIndex: 0,
      explanation:
        'There are eight planets. Pluto was called a planet until 2006, when scientists named it a dwarf planet.',
      hint: 'Pluto used to be on the list, but it is not counted anymore.',
    },
    {
      text: 'Which planet has the biggest and brightest rings?',
      options: ['Mars', 'Saturn', 'Venus', 'Mercury'],
      correctIndex: 1,
      explanation:
        "Saturn's rings are made of billions of pieces of ice and rock. Jupiter, Uranus and Neptune have rings too, but they are thin and dark.",
      hint: 'It is the sixth planet from the Sun.',
    },
  ],
};

const animals: SeedQuiz = {
  id: 'seed-quiz-animals',
  title: 'Animals of the World',
  topic: 'Animals of the World',
  theme: 'NATURE',
  difficulty: 'EASY',
  audience: 'KIDS',
  language: 'EN',
  timePerQuestion: 45,
  questions: [
    {
      text: 'What is the largest animal that has ever lived?',
      options: ['African elephant', 'Blue whale', 'Giraffe', 'Great white shark'],
      correctIndex: 1,
      explanation:
        'The blue whale can grow to about 30 meters long, and it is heavier than any dinosaur we know of.',
      hint: 'It lives in the ocean, but it is not a fish.',
    },
    {
      text: 'Which animal is the fastest runner on land?',
      options: ['Lion', 'Horse', 'Cheetah', 'Kangaroo'],
      correctIndex: 2,
      explanation:
        'A cheetah can sprint at about 100 km/h, but only for a short dash before it needs a rest.',
      hint: 'Think of a hunter that catches its food by sprinting, not by sneaking up close.',
    },
    {
      text: 'What do giant pandas eat most of the time?',
      options: ['Fish', 'Insects', 'Fruit', 'Bamboo'],
      correctIndex: 3,
      explanation:
        "Bamboo is about 99% of a panda's food, so a panda spends up to 14 hours a day eating.",
      hint: 'It is a tall, tough plant that grows in the mountain forests of China.',
    },
    {
      text: 'Which of these animals is a mammal?',
      options: ['Dolphin', 'Shark', 'Salmon', 'Octopus'],
      correctIndex: 0,
      explanation:
        'Dolphins are mammals: they breathe air through a blowhole and feed their babies milk.',
      hint: 'Mammals breathe air and feed their babies milk.',
    },
    {
      text: 'How many legs does a spider have?',
      options: ['Six', 'Eight', 'Ten', 'Four'],
      correctIndex: 1,
      explanation: 'Spiders have eight legs. That is why they are not insects, which have six.',
      hint: 'Spiders are not insects, and they have more legs than an ant.',
    },
    {
      text: 'Where do almost all wild penguins live?',
      options: [
        'Near the North Pole',
        'In the Amazon rainforest',
        'In the southern half of the world',
        'In the deserts of Asia',
      ],
      correctIndex: 2,
      explanation:
        'Almost all wild penguins live in the southern half of the world, from icy Antarctica to the coasts of South America, Africa and Australia.',
      hint: 'Polar bears live near the North Pole, and they never meet penguins in the wild.',
    },
  ],
};

const srbija: SeedQuiz = {
  id: 'seed-quiz-srbija',
  title: 'Srbija: gradovi i reke',
  topic: 'Gradovi i reke Srbije',
  theme: 'GEOGRAPHY',
  difficulty: 'EASY',
  audience: 'KIDS',
  language: 'SR',
  timePerQuestion: 45,
  questions: [
    {
      text: 'Koji je glavni grad Srbije?',
      options: ['Novi Sad', 'Beograd', 'Niš', 'Kragujevac'],
      correctIndex: 1,
      explanation:
        'Beograd je glavni i najveći grad Srbije. Nalazi se na mestu gde se Sava uliva u Dunav.',
      hint: 'Ovaj grad leži na ušću dve velike reke.',
    },
    {
      text: 'Koja je najduža reka koja protiče kroz Srbiju?',
      options: ['Morava', 'Drina', 'Dunav', 'Tisa'],
      correctIndex: 2,
      explanation: 'Dunav je druga najduža reka u Evropi. Kroz Srbiju teče oko 588 kilometara.',
      hint: 'Ova reka prolazi kroz deset država pre nego što se ulije u Crno more.',
    },
    {
      text: 'U kom gradu se nalazi Petrovaradinska tvrđava?',
      options: ['Beograd', 'Subotica', 'Niš', 'Novi Sad'],
      correctIndex: 3,
      explanation:
        'Petrovaradinska tvrđava stoji na obali Dunava, preko puta centra Novog Sada. Na njoj se svakog leta održava festival Egzit.',
      hint: 'Ovaj grad se nalazi u Vojvodini, na obali Dunava.',
    },
    {
      text: 'Koja reka se uliva u Dunav kod Beograda?',
      options: ['Sava', 'Tisa', 'Drina', 'Timok'],
      correctIndex: 0,
      explanation: 'Sava se uliva u Dunav kod Beograda, tačno ispod Kalemegdanske tvrđave.',
      hint: 'Ova reka izvire u Sloveniji i protiče kroz Zagreb.',
    },
    {
      text: 'U kom gradu je rođen rimski car Konstantin Veliki?',
      options: ['Kraljevo', 'Niš', 'Čačak', 'Sombor'],
      correctIndex: 1,
      explanation: 'Konstantin Veliki rođen je u Nišu, koji se u rimsko doba zvao Naisus.',
      hint: 'To je treći grad po veličini u Srbiji i nalazi se na jugu zemlje.',
    },
    {
      text: 'Koja reka većim delom razdvaja Srbiju i Bosnu i Hercegovinu?',
      options: ['Ibar', 'Morava', 'Tisa', 'Drina'],
      correctIndex: 3,
      explanation:
        'Drina je duga 346 kilometara i veći deo njenog toka je granica između Srbije i Bosne i Hercegovine.',
      hint: 'Ova reka nastaje spajanjem Tare i Pive.',
    },
  ],
};

const javascript: SeedQuiz = {
  id: 'seed-quiz-javascript',
  title: 'JavaScript Basics',
  topic: 'JavaScript basics',
  theme: 'TECHNOLOGY',
  difficulty: 'MEDIUM',
  audience: 'ADULTS',
  language: 'EN',
  timePerQuestion: 30,
  questions: [
    {
      text: 'Which keyword declares a variable that cannot be reassigned?',
      options: ['var', 'let', 'const', 'static'],
      correctIndex: 2,
      explanation:
        'const creates a binding that cannot be reassigned. If it holds an object or an array, the contents can still change.',
      hint: 'One option is not a variable keyword at all, and one is the old function-scoped way.',
    },
    {
      text: 'What does typeof null return?',
      options: ["'null'", "'object'", "'undefined'", "'number'"],
      correctIndex: 1,
      explanation:
        "typeof null returns 'object'. It is a bug from the first version of JavaScript that was kept so old websites would not break.",
      hint: 'The answer is a famous mistake in the language that was never fixed.',
    },
    {
      text: 'What is the result of 0.1 + 0.2 === 0.3?',
      options: ['true', 'undefined', 'NaN', 'false'],
      correctIndex: 3,
      explanation:
        '0.1 + 0.2 gives 0.30000000000000004 because numbers are stored as binary floating point, so the comparison is false.',
      hint: 'Computers store decimal fractions in binary, and some of them cannot be stored exactly.',
    },
    {
      text: 'Which array method returns a new array with the result of a function for every element?',
      options: ['map', 'forEach', 'find', 'some'],
      correctIndex: 0,
      explanation:
        'map returns a new array of the same length. forEach also visits every element, but it always returns undefined.',
      hint: 'Which method would you use to turn [1, 2, 3] into [2, 4, 6]?',
    },
    {
      text: 'What does === check that == does not?',
      options: [
        'Nothing, they work the same way',
        'That both values have the same type, without converting them',
        'That both values are objects',
        'That both values are numbers',
      ],
      correctIndex: 1,
      explanation:
        "=== is strict equality: it never converts types. That is why '5' == 5 is true but '5' === 5 is false.",
      hint: "Compare '5' == 5 with '5' === 5 in your head.",
    },
    {
      text: 'What does Promise.all do when one of its promises rejects?',
      options: [
        'Waits for the others and ignores the error',
        'Resolves with undefined for that promise',
        'Rejects as soon as any promise rejects',
        'Retries the rejected promise',
      ],
      correctIndex: 2,
      explanation:
        'Promise.all rejects with the reason of the first promise that rejects. Use Promise.allSettled when you need every result.',
      hint: 'Think of it as all or nothing.',
    },
  ],
};

export const DEMO_QUIZZES: SeedQuiz[] = [solarSystem, animals, srbija, javascript];
