
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Clock, CheckCircle, XCircle, Trophy, Zap } from 'lucide-react';

interface Quiz {
  id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  time_limit: number;
  points_per_question: number;
  questions: Question[];
}

interface Question {
  id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  points: number;
}

const TakeQuiz = () => {
  const { studentData } = useAuth();
  const { toast } = useToast();
  const [availableQuizzes, setAvailableQuizzes] = useState<Quiz[]>([]);
  const [currentQuiz, setCurrentQuiz] = useState<Quiz | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [results, setResults] = useState<{
    score: number;
    correctAnswers: number;
    totalQuestions: number;
    pointsEarned: number;
    timeTaken: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAvailableQuizzes = async () => {
    try {
      const { data, error } = await supabase
        .from('quizzes')
        .select(`
          *,
          questions(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAvailableQuizzes(data || []);
    } catch (error) {
      console.error('Error fetching quizzes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAvailableQuizzes();
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (quizStarted && timeLeft > 0 && !quizCompleted) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleSubmitQuiz();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [quizStarted, timeLeft, quizCompleted]);

  const startQuiz = (quiz: Quiz) => {
    setCurrentQuiz(quiz);
    setTimeLeft(quiz.time_limit);
    setQuizStarted(true);
    setCurrentQuestionIndex(0);
    setAnswers({});
    setQuizCompleted(false);
    setResults(null);
  };

  const selectAnswer = (questionId: string, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const nextQuestion = () => {
    if (currentQuiz && currentQuestionIndex < currentQuiz.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmitQuiz = async () => {
    if (!currentQuiz || !studentData) return;

    const correctAnswers = currentQuiz.questions.filter(
      question => answers[question.id] === question.correct_answer
    ).length;

    const score = Math.round((correctAnswers / currentQuiz.questions.length) * 100);
    const pointsEarned = correctAnswers * currentQuiz.points_per_question;
    const timeTaken = currentQuiz.time_limit - timeLeft;

    try {
      // Save quiz attempt
      const { error } = await supabase
        .from('user_quiz_attempts')
        .insert({
          student_id: studentData.id,
          quiz_id: currentQuiz.id,
          score,
          total_questions: currentQuiz.questions.length,
          correct_answers: correctAnswers,
          time_taken: timeTaken,
          points_earned: pointsEarned,
        });

      if (error) throw error;

      // Update student points
      const { error: updateError } = await supabase
        .from('students')
        .update({
          total_points: (studentData.total_points || 0) + pointsEarned,
          level: Math.floor(((studentData.total_points || 0) + pointsEarned) / 100) + 1,
        })
        .eq('id', studentData.id);

      if (updateError) throw updateError;

      setResults({
        score,
        correctAnswers,
        totalQuestions: currentQuiz.questions.length,
        pointsEarned,
        timeTaken,
      });
      setQuizCompleted(true);

      toast({
        title: "Quiz Completed!",
        description: `You scored ${score}% and earned ${pointsEarned} points!`,
      });
    } catch (error) {
      console.error('Error submitting quiz:', error);
      toast({
        title: "Error",
        description: "Failed to submit quiz",
        variant: "destructive",
      });
    }
  };

  const resetQuiz = () => {
    setCurrentQuiz(null);
    setQuizStarted(false);
    setQuizCompleted(false);
    setCurrentQuestionIndex(0);
    setAnswers({});
    setResults(null);
    setTimeLeft(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'hard': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Quiz Results Screen
  if (quizCompleted && results) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md dark:bg-gray-800 dark:border-gray-700">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-4">
              <Trophy className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle className="text-2xl dark:text-white">Quiz Completed!</CardTitle>
            <CardDescription className="dark:text-gray-300">Great job on finishing the quiz</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                {results.score}%
              </div>
              <p className="text-gray-600 dark:text-gray-400">Your Score</p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="flex items-center justify-center mb-2">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mr-1" />
                  <span className="font-semibold text-green-600 dark:text-green-400">{results.correctAnswers}</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Correct</p>
              </div>
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <div className="flex items-center justify-center mb-2">
                  <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 mr-1" />
                  <span className="font-semibold text-red-600 dark:text-red-400">
                    {results.totalQuestions - results.correctAnswers}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Incorrect</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Points Earned:</span>
                <span className="font-semibold text-yellow-600 dark:text-yellow-400">
                  +{results.pointsEarned} pts
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Time Taken:</span>
                <span className="font-semibold dark:text-white">{formatTime(results.timeTaken)}</span>
              </div>
            </div>

            <Button onClick={resetQuiz} className="w-full">
              Take Another Quiz
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Quiz Taking Screen
  if (quizStarted && currentQuiz) {
    const currentQuestion = currentQuiz.questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / currentQuiz.questions.length) * 100;

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 dark:from-gray-900 dark:to-gray-800 p-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-2xl font-bold dark:text-white">{currentQuiz.title}</h1>
              <div className="flex items-center space-x-4">
                <div className="flex items-center text-red-600 dark:text-red-400">
                  <Clock className="w-5 h-5 mr-2" />
                  <span className="font-mono text-lg">{formatTime(timeLeft)}</span>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>Question {currentQuestionIndex + 1} of {currentQuiz.questions.length}</span>
                <span>{Math.round(progress)}% Complete</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </div>

          {/* Question */}
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-xl dark:text-white">{currentQuestion.question_text}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {['A', 'B', 'C', 'D'].map((option) => {
                const optionText = currentQuestion[`option_${option.toLowerCase()}` as keyof Question] as string;
                const isSelected = answers[currentQuestion.id] === option;
                
                return (
                  <button
                    key={option}
                    onClick={() => selectAnswer(currentQuestion.id, option)}
                    className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 dark:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-sm font-medium ${
                        isSelected
                          ? 'border-blue-500 bg-blue-500 text-white'
                          : 'border-gray-400 dark:border-gray-500 text-gray-400 dark:text-gray-500'
                      }`}>
                        {option}
                      </div>
                      <span className="dark:text-white">{optionText}</span>
                    </div>
                  </button>
                );
              })}
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex justify-between items-center mt-6">
            <Button
              onClick={previousQuestion}
              disabled={currentQuestionIndex === 0}
              variant="outline"
            >
              Previous
            </Button>
            
            <div className="flex space-x-3">
              {currentQuestionIndex === currentQuiz.questions.length - 1 ? (
                <Button onClick={handleSubmitQuiz} className="px-8">
                  Submit Quiz
                </Button>
              ) : (
                <Button
                  onClick={nextQuestion}
                  disabled={!answers[currentQuestion.id]}
                >
                  Next
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Quiz Selection Screen
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Take Quiz</h1>
        <p className="text-gray-600 dark:text-gray-300">Choose a quiz to test your knowledge</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {availableQuizzes.map((quiz) => (
          <Card key={quiz.id} className="hover:shadow-lg transition-shadow dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg dark:text-white">{quiz.title}</CardTitle>
                <Badge className={getDifficultyColor(quiz.difficulty)}>
                  {quiz.difficulty}
                </Badge>
              </div>
              <CardDescription className="dark:text-gray-300">{quiz.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <Clock className="w-4 h-4 mr-2" />
                  {Math.floor(quiz.time_limit / 60)} minutes
                </div>
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <Zap className="w-4 h-4 mr-2" />
                  {quiz.questions.length} questions
                </div>
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <Trophy className="w-4 h-4 mr-2" />
                  Up to {quiz.questions.length * quiz.points_per_question} points
                </div>
              </div>
              <Button 
                onClick={() => startQuiz(quiz)} 
                className="w-full mt-4"
              >
                Start Quiz
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default TakeQuiz;
