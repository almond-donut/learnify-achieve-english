
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Trash2, Edit, Plus, BookOpen, Users, BarChart3, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Question {
  id?: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: 'A' | 'B' | 'C' | 'D';
  points: number;
  order_index: number;
}

interface Quiz {
  id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  time_limit: number;
  points_per_question: number;
  created_at: string;
  questions?: Question[];
}

const QuizManagement = () => {
  const { teacherData } = useAuth();
  const { toast } = useToast();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [newQuiz, setNewQuiz] = useState({
    title: '',
    description: '',
    difficulty: 'medium' as const,
    time_limit: 300,
    points_per_question: 10,
  });
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Question>({
    question_text: '',
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    correct_answer: 'A',
    points: 10,
    order_index: 0,
  });

  useEffect(() => {
    fetchQuizzes();
  }, [teacherData]);

  const fetchQuizzes = async () => {
    if (!teacherData) return;
    
    try {
      const { data, error } = await supabase
        .from('quizzes')
        .select(`
          *,
          questions (*)
        `)
        .eq('created_by', teacherData.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setQuizzes(data || []);
    } catch (error) {
      console.error('Error fetching quizzes:', error);
      toast({
        title: "Error",
        description: "Failed to load quizzes",
        variant: "destructive",
      });
    }
  };

  const addQuestion = () => {
    if (!currentQuestion.question_text.trim()) {
      toast({
        title: "Error",
        description: "Please enter a question",
        variant: "destructive",
      });
      return;
    }

    const question: Question = {
      ...currentQuestion,
      order_index: questions.length,
    };

    setQuestions([...questions, question]);
    setCurrentQuestion({
      question_text: '',
      option_a: '',
      option_b: '',
      option_c: '',
      option_d: '',
      correct_answer: 'A',
      points: newQuiz.points_per_question,
      order_index: 0,
    });

    toast({
      title: "Question Added",
      description: `Question ${questions.length + 1} has been added to the quiz`,
    });
  };

  const removeQuestion = (index: number) => {
    const updatedQuestions = questions.filter((_, i) => i !== index);
    setQuestions(updatedQuestions.map((q, i) => ({ ...q, order_index: i })));
  };

  const createQuiz = async () => {
    if (!teacherData || !newQuiz.title.trim() || questions.length === 0) {
      toast({
        title: "Error",
        description: "Please fill in all required fields and add at least one question",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Create quiz
      const { data: quiz, error: quizError } = await supabase
        .from('quizzes')
        .insert({
          title: newQuiz.title,
          description: newQuiz.description,
          difficulty: newQuiz.difficulty,
          time_limit: newQuiz.time_limit,
          points_per_question: newQuiz.points_per_question,
          created_by: teacherData.id,
        })
        .select()
        .single();

      if (quizError) throw quizError;

      // Create questions
      const questionsToInsert = questions.map(q => ({
        ...q,
        quiz_id: quiz.id,
      }));

      const { error: questionsError } = await supabase
        .from('questions')
        .insert(questionsToInsert);

      if (questionsError) throw questionsError;

      toast({
        title: "Quiz Created!",
        description: `"${newQuiz.title}" has been created with ${questions.length} questions`,
      });

      // Reset form
      setNewQuiz({
        title: '',
        description: '',
        difficulty: 'medium',
        time_limit: 300,
        points_per_question: 10,
      });
      setQuestions([]);
      setIsCreateDialogOpen(false);
      fetchQuizzes();
    } catch (error) {
      console.error('Error creating quiz:', error);
      toast({
        title: "Error",
        description: "Failed to create quiz",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteQuiz = async (quizId: string) => {
    try {
      const { error } = await supabase
        .from('quizzes')
        .delete()
        .eq('id', quizId);

      if (error) throw error;

      toast({
        title: "Quiz Deleted",
        description: "The quiz has been successfully deleted",
      });
      fetchQuizzes();
    } catch (error) {
      console.error('Error deleting quiz:', error);
      toast({
        title: "Error",
        description: "Failed to delete quiz",
        variant: "destructive",
      });
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'hard': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Quiz Management</h1>
          <p className="text-gray-600 dark:text-gray-300">Create and manage quizzes for your students</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create Quiz
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Quiz</DialogTitle>
              <DialogDescription>
                Build an engaging quiz for your students with multiple choice questions
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="details">Quiz Details</TabsTrigger>
                <TabsTrigger value="questions">Questions ({questions.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Quiz Title *</Label>
                    <Input
                      id="title"
                      placeholder="e.g., English Grammar Basics"
                      value={newQuiz.title}
                      onChange={(e) => setNewQuiz({ ...newQuiz, title: e.target.value })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="difficulty">Difficulty</Label>
                    <Select
                      value={newQuiz.difficulty}
                      onValueChange={(value: 'easy' | 'medium' | 'hard') => 
                        setNewQuiz({ ...newQuiz, difficulty: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">Easy</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="hard">Hard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="time_limit">Time Limit (seconds)</Label>
                    <Input
                      id="time_limit"
                      type="number"
                      value={newQuiz.time_limit}
                      onChange={(e) => setNewQuiz({ ...newQuiz, time_limit: parseInt(e.target.value) || 300 })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="points">Points per Question</Label>
                    <Input
                      id="points"
                      type="number"
                      value={newQuiz.points_per_question}
                      onChange={(e) => setNewQuiz({ ...newQuiz, points_per_question: parseInt(e.target.value) || 10 })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Brief description of what this quiz covers..."
                    value={newQuiz.description}
                    onChange={(e) => setNewQuiz({ ...newQuiz, description: e.target.value })}
                    rows={3}
                  />
                </div>
              </TabsContent>

              <TabsContent value="questions" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Plus className="w-5 h-5" />
                      Add Question
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="question">Question *</Label>
                      <Textarea
                        id="question"
                        placeholder="Enter your question here..."
                        value={currentQuestion.question_text}
                        onChange={(e) => setCurrentQuestion({ ...currentQuestion, question_text: e.target.value })}
                        rows={2}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="option_a">Option A</Label>
                        <Input
                          id="option_a"
                          placeholder="First option"
                          value={currentQuestion.option_a}
                          onChange={(e) => setCurrentQuestion({ ...currentQuestion, option_a: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="option_b">Option B</Label>
                        <Input
                          id="option_b"
                          placeholder="Second option"
                          value={currentQuestion.option_b}
                          onChange={(e) => setCurrentQuestion({ ...currentQuestion, option_b: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="option_c">Option C</Label>
                        <Input
                          id="option_c"
                          placeholder="Third option"
                          value={currentQuestion.option_c}
                          onChange={(e) => setCurrentQuestion({ ...currentQuestion, option_c: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="option_d">Option D</Label>
                        <Input
                          id="option_d"
                          placeholder="Fourth option"
                          value={currentQuestion.option_d}
                          onChange={(e) => setCurrentQuestion({ ...currentQuestion, option_d: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label>Correct Answer</Label>
                      <RadioGroup
                        value={currentQuestion.correct_answer}
                        onValueChange={(value: 'A' | 'B' | 'C' | 'D') => 
                          setCurrentQuestion({ ...currentQuestion, correct_answer: value })
                        }
                        className="flex flex-wrap gap-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="A" id="correct_a" />
                          <Label htmlFor="correct_a">A</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="B" id="correct_b" />
                          <Label htmlFor="correct_b">B</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="C" id="correct_c" />
                          <Label htmlFor="correct_c">C</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="D" id="correct_d" />
                          <Label htmlFor="correct_d">D</Label>
                        </div>
                      </RadioGroup>
                    </div>

                    <Button onClick={addQuestion} className="w-full">
                      Add Question
                    </Button>
                  </CardContent>
                </Card>

                {questions.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Questions Added ({questions.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {questions.map((q, index) => (
                          <div key={index} className="flex items-start justify-between p-3 border rounded-lg dark:border-gray-700">
                            <div className="flex-1">
                              <p className="font-medium dark:text-white">
                                {index + 1}. {q.question_text}
                              </p>
                              <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                                <span className={q.correct_answer === 'A' ? 'text-green-600 font-semibold' : 'text-gray-600 dark:text-gray-400'}>
                                  A) {q.option_a}
                                </span>
                                <span className={q.correct_answer === 'B' ? 'text-green-600 font-semibold' : 'text-gray-600 dark:text-gray-400'}>
                                  B) {q.option_b}
                                </span>
                                <span className={q.correct_answer === 'C' ? 'text-green-600 font-semibold' : 'text-gray-600 dark:text-gray-400'}>
                                  C) {q.option_c}
                                </span>
                                <span className={q.correct_answer === 'D' ? 'text-green-600 font-semibold' : 'text-gray-600 dark:text-gray-400'}>
                                  D) {q.option_d}
                                </span>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeQuestion(index)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createQuiz} disabled={isLoading || questions.length === 0}>
                    {isLoading ? 'Creating...' : `Create Quiz (${questions.length} questions)`}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium dark:text-gray-300">Total Quizzes</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold dark:text-white">{quizzes.length}</div>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium dark:text-gray-300">Total Questions</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold dark:text-white">
              {quizzes.reduce((total, quiz) => total + (quiz.questions?.length || 0), 0)}
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium dark:text-gray-300">Avg Questions/Quiz</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold dark:text-white">
              {quizzes.length > 0 
                ? Math.round(quizzes.reduce((total, quiz) => total + (quiz.questions?.length || 0), 0) / quizzes.length)
                : 0
              }
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium dark:text-gray-300">Avg Time Limit</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold dark:text-white">
              {quizzes.length > 0 
                ? Math.round(quizzes.reduce((total, quiz) => total + quiz.time_limit, 0) / quizzes.length / 60)
                : 0
              }m
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quizzes List */}
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="dark:text-white">Your Quizzes</CardTitle>
          <CardDescription className="dark:text-gray-300">
            Manage your created quizzes and track their performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          {quizzes.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No quizzes yet</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Create your first quiz to get started with engaging your students
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Quiz
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {quizzes.map((quiz) => (
                <Card key={quiz.id} className="dark:bg-gray-700 dark:border-gray-600">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg dark:text-white">{quiz.title}</CardTitle>
                        <CardDescription className="dark:text-gray-300 mt-1">
                          {quiz.description || 'No description'}
                        </CardDescription>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteQuiz(quiz.id)}
                        className="text-red-600 hover:text-red-700 ml-2"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Difficulty:</span>
                        <Badge className={getDifficultyColor(quiz.difficulty)}>
                          {quiz.difficulty}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Questions:</span>
                        <span className="font-medium dark:text-white">{quiz.questions?.length || 0}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Time Limit:</span>
                        <span className="font-medium dark:text-white">{Math.round(quiz.time_limit / 60)}m</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Points/Question:</span>
                        <span className="font-medium dark:text-white">{quiz.points_per_question}</span>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t dark:border-gray-600">
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1">
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        <Button size="sm" className="flex-1">
                          <BarChart3 className="w-4 h-4 mr-1" />
                          Stats
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default QuizManagement;
