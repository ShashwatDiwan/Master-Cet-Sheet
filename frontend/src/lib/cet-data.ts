export interface Chapter {
  id: string;
  name: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  isImportant: boolean;
  isCompleted: boolean;
  resources: {
    handwrittenNotes: boolean;
    shortNotes: boolean;
    formulaBooklet: boolean;
    pyqs: boolean;
    videoExplanation: boolean;
  };
  status: 'available' | 'coming-soon';
}

export interface SubjectSheet {
  id: string;
  title: string;
  description: string;
  subject: 'Physics' | 'Chemistry' | 'Mathematics';
  totalChapters: number;
  completedChapters: number;
  availableChapters: number;
  totalResources: number;
  progress: number;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  chapters: Chapter[];
}

export const cetSubjects: SubjectSheet[] = [
  {
    id: '1',
    title: 'Physics Mastery',
    description: 'Complete physics preparation with mechanics, thermodynamics, optics, and modern physics',
    subject: 'Physics',
    totalChapters: 20,
    completedChapters: 0,
    availableChapters: 20,
    totalResources: 120,
    progress: 0,
    difficulty: 'Intermediate',
    chapters: [
      {
        id: '1',
        name: 'Units and Measurements',
        difficulty: 'Easy',
        isImportant: false,
        isCompleted: false,
        resources: {
          handwrittenNotes: true,
          shortNotes: true,
          formulaBooklet: true,
          pyqs: true,
          videoExplanation: true
        },
        status: 'available'
      },
      {
        id: '2',
        name: 'Motion in a Straight Line',
        difficulty: 'Easy',
        isImportant: false,
        isCompleted: false,
        resources: {
          handwrittenNotes: true,
          shortNotes: true,
          formulaBooklet: true,
          pyqs: true,
          videoExplanation: true
        },
        status: 'available'
      },
      {
        id: '3',
        name: 'Motion in a Plane',
        difficulty: 'Medium',
        isImportant: true,
        isCompleted: false,
        resources: {
          handwrittenNotes: true,
          shortNotes: true,
          formulaBooklet: true,
          pyqs: true,
          videoExplanation: true
        },
        status: 'available'
      },
      {
        id: '4',
        name: 'Laws of Motion',
        difficulty: 'Medium',
        isImportant: true,
        isCompleted: false,
        resources: {
          handwrittenNotes: true,
          shortNotes: true,
          formulaBooklet: true,
          pyqs: true,
          videoExplanation: true
        },
        status: 'available'
      },
      {
        id: '5',
        name: 'Work, Energy and Power',
        difficulty: 'Medium',
        isImportant: true,
        isCompleted: false,
        resources: {
          handwrittenNotes: true,
          shortNotes: true,
          formulaBooklet: true,
          pyqs: true,
          videoExplanation: true
        },
        status: 'available'
      },
      {
        id: '6',
        name: 'System of Particles and Rotational Motion',
        difficulty: 'Hard',
        isImportant: true,
        isCompleted: false,
        resources: {
          handwrittenNotes: true,
          shortNotes: true,
          formulaBooklet: true,
          pyqs: true,
          videoExplanation: true
        },
        status: 'available'
      },
      {
        id: '7',
        name: 'Gravitation',
        difficulty: 'Medium',
        isImportant: false,
        isCompleted: false,
        resources: {
          handwrittenNotes: true,
          shortNotes: true,
          formulaBooklet: true,
          pyqs: true,
          videoExplanation: true
        },
        status: 'available'
      },
      {
        id: '8',
        name: 'Mechanical Properties of Solids',
        difficulty: 'Medium',
        isImportant: false,
        isCompleted: false,
        resources: {
          handwrittenNotes: true,
          shortNotes: true,
          formulaBooklet: true,
          pyqs: true,
          videoExplanation: true
        },
        status: 'available'
      },
      {
        id: '9',
        name: 'Mechanical Properties of Fluids',
        difficulty: 'Medium',
        isImportant: false,
        isCompleted: false,
        resources: {
          handwrittenNotes: true,
          shortNotes: true,
          formulaBooklet: true,
          pyqs: true,
          videoExplanation: true
        },
        status: 'available'
      },
      {
        id: '10',
        name: 'Thermal Properties of Matter',
        difficulty: 'Medium',
        isImportant: true,
        isCompleted: false,
        resources: {
          handwrittenNotes: true,
          shortNotes: true,
          formulaBooklet: true,
          pyqs: true,
          videoExplanation: true
        },
        status: 'available'
      },
      {
        id: '11',
        name: 'Thermodynamics',
        difficulty: 'Hard',
        isImportant: true,
        isCompleted: false,
        resources: {
          handwrittenNotes: true,
          shortNotes: true,
          formulaBooklet: true,
          pyqs: true,
          videoExplanation: true
        },
        status: 'available'
      },
      {
        id: '12',
        name: 'Kinetic Theory',
        difficulty: 'Medium',
        isImportant: false,
        isCompleted: false,
        resources: {
          handwrittenNotes: true,
          shortNotes: true,
          formulaBooklet: true,
          pyqs: true,
          videoExplanation: true
        },
        status: 'available'
      },
      {
        id: '13',
        name: 'Oscillations',
        difficulty: 'Medium',
        isImportant: true,
        isCompleted: false,
        resources: {
          handwrittenNotes: true,
          shortNotes: true,
          formulaBooklet: true,
          pyqs: true,
          videoExplanation: true
        },
        status: 'available'
      },
      {
        id: '14',
        name: 'Waves',
        difficulty: 'Medium',
        isImportant: true,
        isCompleted: false,
        resources: {
          handwrittenNotes: true,
          shortNotes: true,
          formulaBooklet: true,
          pyqs: true,
          videoExplanation: true
        },
        status: 'available'
      },
      {
        id: '15',
        name: 'Electric Charges and Fields',
        difficulty: 'Medium',
        isImportant: true,
        isCompleted: false,
        resources: {
          handwrittenNotes: true,
          shortNotes: true,
          formulaBooklet: true,
          pyqs: true,
          videoExplanation: true
        },
        status: 'available'
      },
      {
        id: '16',
        name: 'Electrostatic Potential and Capacitance',
        difficulty: 'Hard',
        isImportant: true,
        isCompleted: false,
        resources: {
          handwrittenNotes: true,
          shortNotes: true,
          formulaBooklet: true,
          pyqs: true,
          videoExplanation: true
        },
        status: 'available'
      },
      {
        id: '17',
        name: 'Current Electricity',
        difficulty: 'Medium',
        isImportant: true,
        isCompleted: false,
        resources: {
          handwrittenNotes: true,
          shortNotes: true,
          formulaBooklet: true,
          pyqs: true,
          videoExplanation: true
        },
        status: 'available'
      },
      {
        id: '18',
        name: 'Moving Charges and Magnetism',
        difficulty: 'Hard',
        isImportant: true,
        isCompleted: false,
        resources: {
          handwrittenNotes: true,
          shortNotes: true,
          formulaBooklet: true,
          pyqs: true,
          videoExplanation: true
        },
        status: 'available'
      },
      {
        id: '19',
        name: 'Magnetism and Matter',
        difficulty: 'Medium',
        isImportant: false,
        isCompleted: false,
        resources: {
          handwrittenNotes: true,
          shortNotes: true,
          formulaBooklet: true,
          pyqs: true,
          videoExplanation: true
        },
        status: 'available'
      },
      {
        id: '20',
        name: 'Electromagnetic Induction',
        difficulty: 'Hard',
        isImportant: true,
        isCompleted: false,
        resources: {
          handwrittenNotes: true,
          shortNotes: true,
          formulaBooklet: true,
          pyqs: true,
          videoExplanation: true
        },
        status: 'available'
      }
    ]
  },
  {
    id: '2',
    title: 'Chemistry Complete',
    description: 'Comprehensive chemistry coverage including organic, inorganic, and physical chemistry',
    subject: 'Chemistry',
    totalChapters: 18,
    completedChapters: 0,
    availableChapters: 18,
    totalResources: 108,
    progress: 0,
    difficulty: 'Advanced',
    chapters: [
      {
        id: '1',
        name: 'Some Basic Concepts of Chemistry',
        difficulty: 'Easy',
        isImportant: false,
        isCompleted: false,
        resources: {
          handwrittenNotes: true,
          shortNotes: true,
          formulaBooklet: true,
          pyqs: true,
          videoExplanation: true
        },
        status: 'available'
      },
      {
        id: '2',
        name: 'Structure of Atom',
        difficulty: 'Medium',
        isImportant: true,
        isCompleted: false,
        resources: {
          handwrittenNotes: true,
          shortNotes: true,
          formulaBooklet: true,
          pyqs: true,
          videoExplanation: true
        },
        status: 'available'
      },
      {
        id: '3',
        name: 'Classification of Elements and Periodicity',
        difficulty: 'Medium',
        isImportant: true,
        isCompleted: false,
        resources: {
          handwrittenNotes: true,
          shortNotes: true,
          formulaBooklet: true,
          pyqs: true,
          videoExplanation: true
        },
        status: 'available'
      },
      {
        id: '4',
        name: 'Chemical Bonding and Molecular Structure',
        difficulty: 'Hard',
        isImportant: true,
        isCompleted: false,
        resources: {
          handwrittenNotes: true,
          shortNotes: true,
          formulaBooklet: true,
          pyqs: true,
          videoExplanation: true
        },
        status: 'available'
      },
      {
        id: '5',
        name: 'States of Matter',
        difficulty: 'Medium',
        isImportant: false,
        isCompleted: false,
        resources: {
          handwrittenNotes: true,
          shortNotes: true,
          formulaBooklet: true,
          pyqs: true,
          videoExplanation: true
        },
        status: 'available'
      },
      {
        id: '6',
        name: 'Thermodynamics',
        difficulty: 'Hard',
        isImportant: true,
        isCompleted: false,
        resources: {
          handwrittenNotes: true,
          shortNotes: true,
          formulaBooklet: true,
          pyqs: true,
          videoExplanation: true
        },
        status: 'available'
      },
      {
        id: '7',
        name: 'Equilibrium',
        difficulty: 'Hard',
        isImportant: true,
        isCompleted: false,
        resources: {
          handwrittenNotes: true,
          shortNotes: true,
          formulaBooklet: true,
          pyqs: true,
          videoExplanation: true
        },
        status: 'available'
      },
      {
        id: '8',
        name: 'Redox Reactions',
        difficulty: 'Medium',
        isImportant: true,
        isCompleted: false,
        resources: {
          handwrittenNotes: true,
          shortNotes: true,
          formulaBooklet: true,
          pyqs: true,
          videoExplanation: true
        },
        status: 'available'
      },
      {
        id: '9',
        name: 'Hydrogen',
        difficulty: 'Easy',
        isImportant: false,
        isCompleted: false,
        resources: {
          handwrittenNotes: true,
          shortNotes: true,
          formulaBooklet: true,
          pyqs: true,
          videoExplanation: true
        },
        status: 'available'
      },
      {
        id: '10',
        name: 's-Block Elements',
        difficulty: 'Medium',
        isImportant: false,
        isCompleted: false,
        resources: {
          handwrittenNotes: true,
          shortNotes: true,
          formulaBooklet: true,
          pyqs: true,
          videoExplanation: true
        },
        status: 'available'
      },
      {
        id: '11',
        name: 'p-Block Elements',
        difficulty: 'Hard',
        isImportant: true,
        isCompleted: false,
        resources: {
          handwrittenNotes: true,
          shortNotes: true,
          formulaBooklet: true,
          pyqs: true,
          videoExplanation: true
        },
        status: 'available'
      },
      {
        id: '12',
        name: 'd and f Block Elements',
        difficulty: 'Hard',
        isImportant: true,
        isCompleted: false,
        resources: {
          handwrittenNotes: true,
          shortNotes: true,
          formulaBooklet: true,
          pyqs: true,
          videoExplanation: true
        },
        status: 'available'
      },
      {
        id: '13',
        name: 'Coordination Compounds',
        difficulty: 'Hard',
        isImportant: true,
        isCompleted: false,
        resources: {
          handwrittenNotes: true,
          shortNotes: true,
          formulaBooklet: true,
          pyqs: true,
          videoExplanation: true
        },
        status: 'available'
      },
      {
        id: '14',
        name: 'Haloalkanes and Haloarenes',
        difficulty: 'Medium',
        isImportant: true,
        isCompleted: false,
        resources: {
          handwrittenNotes: true,
          shortNotes: true,
          formulaBooklet: true,
          pyqs: true,
          videoExplanation: true
        },
        status: 'available'
      },
      {
        id: '15',
        name: 'Alcohols, Phenols and Ethers',
        difficulty: 'Medium',
        isImportant: true,
        isCompleted: false,
        resources: {
          handwrittenNotes: true,
          shortNotes: true,
          formulaBooklet: true,
          pyqs: true,
          videoExplanation: true
        },
        status: 'available'
      },
      {
        id: '16',
        name: 'Aldehydes, Ketones and Carboxylic Acids',
        difficulty: 'Hard',
        isImportant: true,
        isCompleted: false,
        resources: {
          handwrittenNotes: true,
          shortNotes: true,
          formulaBooklet: true,
          pyqs: true,
          videoExplanation: true
        },
        status: 'available'
      },
      {
        id: '17',
        name: 'Amines',
        difficulty: 'Medium',
        isImportant: true,
        isCompleted: false,
        resources: {
          handwrittenNotes: true,
          shortNotes: true,
          formulaBooklet: true,
          pyqs: true,
          videoExplanation: true
        },
        status: 'available'
      },
      {
        id: '18',
        name: 'Biomolecules',
        difficulty: 'Medium',
        isImportant: false,
        isCompleted: false,
        resources: {
          handwrittenNotes: true,
          shortNotes: true,
          formulaBooklet: true,
          pyqs: true,
          videoExplanation: true
        },
        status: 'available'
      }
    ]
  },
  {
    id: '3',
    title: 'Mathematics Excellence',
    description: 'Advanced mathematics covering calculus, algebra, coordinate geometry, and statistics',
    subject: 'Mathematics',
    totalChapters: 16,
    completedChapters: 0,
    availableChapters: 16,
    totalResources: 96,
    progress: 0,
    difficulty: 'Advanced',
    chapters: [
      {
        id: '1',
        name: 'Sets and Functions',
        difficulty: 'Easy',
        isImportant: false,
        isCompleted: false,
        resources: {
          handwrittenNotes: true,
          shortNotes: true,
          formulaBooklet: true,
          pyqs: true,
          videoExplanation: true
        },
        status: 'available'
      },
      {
        id: '2',
        name: 'Algebra',
        difficulty: 'Medium',
        isImportant: true,
        isCompleted: false,
        resources: {
          handwrittenNotes: true,
          shortNotes: true,
          formulaBooklet: true,
          pyqs: true,
          videoExplanation: true
        },
        status: 'available'
      },
      {
        id: '3',
        name: 'Coordinate Geometry',
        difficulty: 'Medium',
        isImportant: true,
        isCompleted: false,
        resources: {
          handwrittenNotes: true,
          shortNotes: true,
          formulaBooklet: true,
          pyqs: true,
          videoExplanation: true
        },
        status: 'available'
      },
      {
        id: '4',
        name: 'Calculus',
        difficulty: 'Hard',
        isImportant: true,
        isCompleted: false,
        resources: {
          handwrittenNotes: true,
          shortNotes: true,
          formulaBooklet: true,
          pyqs: true,
          videoExplanation: true
        },
        status: 'available'
      },
      {
        id: '5',
        name: 'Mathematical Reasoning',
        difficulty: 'Medium',
        isImportant: false,
        isCompleted: false,
        resources: {
          handwrittenNotes: true,
          shortNotes: true,
          formulaBooklet: true,
          pyqs: true,
          videoExplanation: true
        },
        status: 'available'
      },
      {
        id: '6',
        name: 'Statistics and Probability',
        difficulty: 'Medium',
        isImportant: true,
        isCompleted: false,
        resources: {
          handwrittenNotes: true,
          shortNotes: true,
          formulaBooklet: true,
          pyqs: true,
          videoExplanation: true
        },
        status: 'available'
      },
      {
        id: '7',
        name: 'Relations and Functions',
        difficulty: 'Medium',
        isImportant: true,
        isCompleted: false,
        resources: {
          handwrittenNotes: true,
          shortNotes: true,
          formulaBooklet: true,
          pyqs: true,
          videoExplanation: true
        },
        status: 'available'
      },
      {
        id: '8',
        name: 'Inverse Trigonometric Functions',
        difficulty: 'Hard',
        isImportant: true,
        isCompleted: false,
        resources: {
          handwrittenNotes: true,
          shortNotes: true,
          formulaBooklet: true,
          pyqs: true,
          videoExplanation: true
        },
        status: 'available'
      },
      {
        id: '9',
        name: 'Matrices',
        difficulty: 'Medium',
        isImportant: false,
        isCompleted: false,
        resources: {
          handwrittenNotes: true,
          shortNotes: true,
          formulaBooklet: true,
          pyqs: true,
          videoExplanation: true
        },
        status: 'available'
      },
      {
        id: '10',
        name: 'Determinants',
        difficulty: 'Medium',
        isImportant: false,
        isCompleted: false,
        resources: {
          handwrittenNotes: true,
          shortNotes: true,
          formulaBooklet: true,
          pyqs: true,
          videoExplanation: true
        },
        status: 'available'
      },
      {
        id: '11',
        name: 'Application of Derivatives',
        difficulty: 'Hard',
        isImportant: true,
        isCompleted: false,
        resources: {
          handwrittenNotes: true,
          shortNotes: true,
          formulaBooklet: true,
          pyqs: true,
          videoExplanation: true
        },
        status: 'available'
      },
      {
        id: '12',
        name: 'Application of Integrals',
        difficulty: 'Hard',
        isImportant: true,
        isCompleted: false,
        resources: {
          handwrittenNotes: true,
          shortNotes: true,
          formulaBooklet: true,
          pyqs: true,
          videoExplanation: true
        },
        status: 'available'
      },
      {
        id: '13',
        name: 'Differential Equations',
        difficulty: 'Hard',
        isImportant: true,
        isCompleted: false,
        resources: {
          handwrittenNotes: true,
          shortNotes: true,
          formulaBooklet: true,
          pyqs: true,
          videoExplanation: true
        },
        status: 'available'
      },
      {
        id: '14',
        name: 'Vector Algebra',
        difficulty: 'Medium',
        isImportant: true,
        isCompleted: false,
        resources: {
          handwrittenNotes: true,
          shortNotes: true,
          formulaBooklet: true,
          pyqs: true,
          videoExplanation: true
        },
        status: 'available'
      },
      {
        id: '15',
        name: 'Three Dimensional Geometry',
        difficulty: 'Hard',
        isImportant: true,
        isCompleted: false,
        resources: {
          handwrittenNotes: true,
          shortNotes: true,
          formulaBooklet: true,
          pyqs: true,
          videoExplanation: true
        },
        status: 'available'
      },
      {
        id: '16',
        name: 'Linear Programming',
        difficulty: 'Medium',
        isImportant: false,
        isCompleted: false,
        resources: {
          handwrittenNotes: true,
          shortNotes: true,
          formulaBooklet: true,
          pyqs: true,
          videoExplanation: true
        },
        status: 'available'
      }
    ]
  }
];

export const getSubjectById = (id: string): SubjectSheet | undefined => {
  return cetSubjects.find(subject => subject.id === id);
};

export const updateChapterCompletion = (
  subjectId: string, 
  chapterId: string, 
  isCompleted: boolean
): SubjectSheet[] => {
  return cetSubjects.map(subject => {
    if (subject.id === subjectId) {
      const updatedChapters = subject.chapters.map(chapter => {
        if (chapter.id === chapterId) {
          return { ...chapter, isCompleted };
        }
        return chapter;
      });
      
      const completedCount = updatedChapters.filter(ch => ch.isCompleted).length;
      const progress = Math.round((completedCount / subject.totalChapters) * 100);
      
      return {
        ...subject,
        chapters: updatedChapters,
        completedChapters: completedCount,
        progress
      };
    }
    return subject;
  });
}; 