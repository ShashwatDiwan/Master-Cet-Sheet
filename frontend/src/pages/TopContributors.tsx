import { useState } from 'react';
import logo from '@/assets/Logo.png';
import shashImage from '@/assets/shashwat.jpeg';
import jiniImage from '@/assets/Jini.jpg';
import aryanImage from '@/assets/aryan.jpg';
import { Button } from '@/components/ui/button';
import { 
  Trophy, 
  Star, 
  Users, 
  BookOpen, 
  FileText, 
  Video, 
  Github,
  Linkedin,
  X,
  Lightbulb,
  CheckCircle2,
  ArrowRight,
  Mail
} from 'lucide-react';

interface Contributor {
  id: string;
  name: string;
  avatarUrl: string;
  rank: number;
  totalContributions: number;
  subjects: string[];
  videosContributed: number;
  notesContributed: number;
  shortNotesContributed: number;
  joinDate: string;
  bio: string;
  percentile: string;
  achievements: string[];
  socialLinks: {
    github?: string;
    linkedin?: string;
    twitter?: string;
  };
}

const mockContributors: Contributor[] = [
  {
    id: '1',
    name: 'Shashwat Diwan',
    avatarUrl: shashImage,
    rank: 1,
    totalContributions: 38,
    subjects: ['MHTCET'],
    videosContributed: 0,
    notesContributed: 22,
    shortNotesContributed: 16,
    joinDate: 'March 2024',
    bio: 'Motivated Java Developer skilled in building scalable backend-focused applications using Spring Boot, Hibernate, Spring Security, and REST APIs, with exposure to microservices architecture, DevOps practices (CI/CD, Docker), and AI integration using Spring AI. Solved 190+ DSA problems on LeetCode, experienced with MySQL/SQL databases, and recognized as an effective team collaborator',
    percentile: '98.9',
    achievements: ['Top Contributor'],
    socialLinks: { github: 'https://github.com/ShashwatDiwan', linkedin: 'https://www.linkedin.com/in/shashwatdiwan/' }
  },
  {
    id: '2',
    name: 'Jinendra Dhondge',
    avatarUrl: jiniImage,
    rank: 2,
    totalContributions: 20,
    subjects: ['MHTCET'],
    videosContributed: 0,
    notesContributed: 3,
    shortNotesContributed: 17,
    joinDate: 'February 2024',
    bio: 'I am a Full Stack Developer with a passion for building scalable, end-to-end web applications that solve real-world problems. With a strong foundation in Data Structures and Algorithms (DSA), I approach every coding challenge with an analytical mindset to ensure optimal performance.',
    percentile: '98.6',
    achievements: ['Silver Contributor'],
    socialLinks: { linkedin: 'https://www.linkedin.com/in/jinendra-dhongde-b1b4a830b/' }
  },
  {
    id: '3',
    name: 'Aryan Dhole',
    avatarUrl: aryanImage,
    rank: 3,
    totalContributions: 5,
    subjects: ['MHTCET'],
    videosContributed: 0,
    notesContributed: 2,
    shortNotesContributed: 3,
    joinDate: 'January 2024',
    bio: 'I am a Machine Learning Engineer with a deep-rooted foundation in computer science core subjects, including OS, DBMS, and OOPS. My technical expertise is backed by rigorous problem-solving, having successfully tackled 300+ challenges in Data Structures and Algorithms (DSA) to ensure every model I build is optimized for performance and scalability.',
    percentile: '99.1',
    achievements: ['Bronze Contributor'],
    socialLinks: { linkedin: 'https://www.linkedin.com/in/aryan-dhole/' }
  },
];

const getRankBadgeClasses = (rank: number) => {
  if (rank === 1) return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30';
  if (rank === 2) return 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-300 border-zinc-400/30';
  if (rank === 3) return 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30';
  return 'bg-muted text-muted-foreground border-border';
};

const getCardAccent = (rank: number) => {
  if (rank === 1) return 'border-amber-500/30 hover:border-amber-500/50';
  if (rank === 2) return 'border-zinc-400/30 hover:border-zinc-400/50';
  if (rank === 3) return 'border-orange-500/30 hover:border-orange-500/50';
  return 'border-border hover:border-primary/50';
};

const getRankLabel = (rank: number) => {
  if (rank === 1) return '1st';
  if (rank === 2) return '2nd';
  if (rank === 3) return '3rd';
  return `#${rank}`;
};

const TopContributors = () => {
  const [selectedContributor, setSelectedContributor] = useState<Contributor | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showLearnMore, setShowLearnMore] = useState(false);

  const handleContributorClick = (contributor: Contributor) => {
    setSelectedContributor(contributor);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedContributor(null);
  };

  const closeLearnMore = () => {
    setShowLearnMore(false);
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-background">
      <div className="p-6 max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in-up">
          <div className="flex items-center justify-center gap-3 mb-4">
            <img src={logo} alt="EbookStore logo" className="w-16 h-16 object-contain" />
            <div className="text-left">
              <h1 className="text-3xl md:text-4xl font-bold font-poppins text-foreground">
                {"EbookStore's "}
                <span className="text-primary">Top Contributors</span>
              </h1>
            </div>
          </div>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Celebrating the amazing students who share knowledge and help others succeed
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { icon: Users, label: 'Contributors', value: mockContributors.length, description: 'Active members' },
            { icon: FileText, label: 'Total Notes', value: mockContributors.reduce((sum, c) => sum + c.notesContributed, 0), description: 'Study materials' },
            { icon: Video, label: 'Total Videos', value: mockContributors.reduce((sum, c) => sum + c.videosContributed, 0), description: 'Upcoming feature' },
            { icon: BookOpen, label: 'Short Notes', value: mockContributors.reduce((sum, c) => sum + c.shortNotesContributed, 0), description: 'Handwritten' }
          ].map((stat, index) => (
            <div 
              key={stat.label}
              className="bg-card border border-border rounded-xl p-5 animate-fade-in-up card-hover"
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <stat.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                  <p className="text-xs text-muted-foreground/70">{stat.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Hall of Fame */}
        <div className="animate-fade-in-up" style={{ animationDelay: '300ms' }}>
          <div className="flex items-center gap-2 mb-6">
            <Trophy className="w-5 h-5 text-amber-500" />
            <h2 className="text-2xl font-bold text-foreground font-poppins">Hall of Fame</h2>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {mockContributors.slice(0, 3).map((contributor, index) => (
              <div 
                key={contributor.id}
                className={`group cursor-pointer bg-card border rounded-xl p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md animate-fade-in-up ${getCardAccent(contributor.rank)}`}
                style={{ animationDelay: `${400 + index * 100}ms` }}
                onClick={() => handleContributorClick(contributor)}
              >
                {/* Rank Badge */}
                <div className="flex items-center justify-between mb-4">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${getRankBadgeClasses(contributor.rank)}`}>
                    {getRankLabel(contributor.rank)} Place
                  </span>
                  <span className="text-xs text-muted-foreground">{contributor.joinDate}</span>
                </div>
                
                {/* Avatar and Name */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-border">
                    <img src={contributor.avatarUrl} alt={contributor.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{contributor.name}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      {contributor.socialLinks.linkedin && (
                        <a href={contributor.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                          <Linkedin className="w-3.5 h-3.5 text-muted-foreground hover:text-primary transition-colors" />
                        </a>
                      )}
                      {contributor.socialLinks.github && (
                        <a href={contributor.socialLinks.github} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                          <Github className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground transition-colors" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Stats */}
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Total Contributions</span>
                    <span className="font-semibold text-foreground">{contributor.totalContributions}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Notes</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">{contributor.notesContributed}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Short Notes</span>
                    <span className="font-semibold text-primary">{contributor.shortNotesContributed}</span>
                  </div>
                </div>
                
                {/* Percentile */}
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <span className="text-xs text-muted-foreground">MHTCET Percentile</span>
                  <span className="text-sm font-bold text-foreground">{contributor.percentile}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Call to Action */}
        <div className="bg-card border border-border rounded-xl p-8 text-center animate-fade-in-up" style={{ animationDelay: '700ms' }}>
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Mail className="w-6 h-6 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2 font-poppins">Want to Join the Elite?</h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto text-sm">
            {"If you'd like to contribute your notes to the community, simply email them to us and we'll add you to the hall of fame!"}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild>
              <a
                href="https://mail.google.com/mail/?view=cm&fs=1&to=shashh.code@gmail.com&su=Contributing%20Notes&body=Hi%20team,%0A%0AI%27d%20like%20to%20share%20my%20study%20notes%20and%20contribute%20to%20the%20community.%0A%0APlease%20find%20my%20notes%20attached.%0A%0AThanks,%0A[Your%20Name]"
                target="_blank"
                rel="noopener noreferrer"
              >
                Mail Us Your Notes
              </a>
            </Button>
            <Button variant="outline" onClick={() => setShowLearnMore(true)}>
              Learn More
            </Button>
          </div>
        </div>
      </div>

      {/* Contributor Detail Modal */}
      {showModal && selectedContributor && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in" onClick={closeModal}>
          <div className="bg-card border border-border rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-lg animate-scale-in" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="bg-muted/50 p-6 border-b border-border">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-border">
                    <img src={selectedContributor.avatarUrl} alt={selectedContributor.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">{selectedContributor.name}</h2>
                    <p className="text-sm text-muted-foreground">Rank #{selectedContributor.rank} Contributor</p>
                  </div>
                </div>
                <button 
                  onClick={closeModal}
                  className="text-muted-foreground hover:text-foreground p-2 hover:bg-muted rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            {/* Content */}
            <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-100px)]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-2 uppercase tracking-wider">About</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{selectedContributor.bio}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-2 uppercase tracking-wider">Statistics</h3>
                  <div className="space-y-2.5 bg-muted/50 rounded-lg p-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total Contributions</span>
                      <span className="font-semibold text-foreground">{selectedContributor.totalContributions}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">PDFs</span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">{selectedContributor.notesContributed}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Videos</span>
                      <span className="font-semibold text-primary">{selectedContributor.videosContributed}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Short Notes</span>
                      <span className="font-semibold text-amber-600 dark:text-amber-400">{selectedContributor.shortNotesContributed}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-2 uppercase tracking-wider">Achievements</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedContributor.achievements.map((achievement, idx) => (
                    <span 
                      key={idx}
                      className="px-3 py-1.5 bg-amber-500/10 text-amber-700 dark:text-amber-300 rounded-full border border-amber-500/20 text-sm flex items-center gap-1.5"
                    >
                      <Star className="w-3.5 h-3.5" />
                      {achievement}
                    </span>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-2 uppercase tracking-wider">Social Links</h3>
                <div className="flex gap-2">
                  {selectedContributor.socialLinks.github && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={selectedContributor.socialLinks.github} target="_blank" rel="noopener noreferrer">
                        <Github className="w-4 h-4 mr-1.5" />
                        GitHub
                      </a>
                    </Button>
                  )}
                  {selectedContributor.socialLinks.linkedin && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={selectedContributor.socialLinks.linkedin} target="_blank" rel="noopener noreferrer">
                        <Linkedin className="w-4 h-4 mr-1.5" />
                        LinkedIn
                      </a>
                    </Button>
                  )}
                  {selectedContributor.socialLinks.twitter && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={selectedContributor.socialLinks.twitter} target="_blank" rel="noopener noreferrer">
                        Twitter
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Learn More Modal */}
      {showLearnMore && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in" onClick={closeLearnMore}>
          <div className="bg-card border border-border rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-lg animate-scale-in" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="bg-muted/50 p-6 border-b border-border sticky top-0">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-foreground font-poppins">Share Your Knowledge</h2>
                <button 
                  onClick={closeLearnMore}
                  className="text-muted-foreground hover:text-foreground p-2 hover:bg-muted rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            {/* Content */}
            <div className="p-6 space-y-8">
              {/* Motivation Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-amber-500" />
                  Why Share Your Notes?
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {"Contributing your study materials is one of the most meaningful ways to help your peers succeed. When you share your notes, you're not just providing documents -- you're sharing your understanding, insights, and hard work."}
                </p>
                <div className="space-y-3 mt-4">
                  {[
                    { title: 'Help Others Succeed', desc: 'Your notes can be the key resource that helps someone finally understand a difficult concept.' },
                    { title: 'Build Your Reputation', desc: 'Get recognized in our Hall of Fame and build credibility in the student community.' },
                    { title: 'Give Back to the Community', desc: 'Be part of a mission to make quality study materials accessible to everyone.' },
                  ].map((item) => (
                    <div key={item.title} className="flex gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-foreground">{item.title}</p>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Steps Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <ArrowRight className="w-5 h-5 text-primary" />
                  How to Share Your Notes
                </h3>
                <div className="space-y-3">
                  {[
                    { step: 1, title: 'Prepare Your Notes', desc: 'Organize your notes by chapter or topic. Make sure they are legible and well-structured. You can use PDF, images, or any clear format.' },
                    { step: 2, title: 'Click "Mail Us Your Notes"', desc: 'Hit the button below to open a pre-filled email to our contribution team.' },
                    { step: 3, title: 'Attach Your Files', desc: 'Attach your note files to the email along with your name and the chapters/topics they cover.' },
                    { step: 4, title: 'Submit & Get Featured', desc: "Send the email and wait for our team to review. Once approved, you'll be featured in our Hall of Fame!" },
                  ].map((item) => (
                    <div key={item.step} className="bg-muted/50 border border-border rounded-lg p-4">
                      <div className="flex gap-3">
                        <div className="w-7 h-7 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">{item.step}</div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">{item.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA Button */}
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 text-center">
                <p className="text-sm text-muted-foreground mb-4">Ready to make an impact?</p>
                <Button asChild>
                  <a
                    href="https://mail.google.com/mail/?view=cm&fs=1&to=shashh.code@gmail.com&su=Contributing%20Notes&body=Hi%20team,%0A%0AI%27d%20like%20to%20share%20my%20study%20notes%20and%20contribute%20to%20the%20community.%0A%0APlease%20find%20my%20notes%20attached.%0A%0AThanks,%0A[Your%20Name]"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={closeLearnMore}
                  >
                    Mail Us Your Notes Now
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TopContributors;
