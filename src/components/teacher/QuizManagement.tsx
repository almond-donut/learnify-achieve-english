import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Edit, Trash2, Eye, EyeOff, Clock, Users, BookOpen, Lock, Unlock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

interface Quiz {
  id: string;
  title: string;
  description: string | null;
  time_limit: number | null;
  difficulty: 'easy' | 'medium' | 'hard' | null;
  created_at: string | null;
  created_by: string | null;
  points_per_question: number | null;
  questions?: Question[];
  class_quizzes?: ClassQuiz[];
}

interface Question {
  id: string;
  quiz_id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  points: number | null;
  order_index: number | null;
}

interface ClassQuiz {
  id: string;
  class_id: string;
  quiz_id: string;
  assigned_at: string | null;
  due_date: string | null;
  classes?: {
    name: string;
  };
}

interface Class {
  id: string;
  name: string;
}

export const QuizManagement: React.FC = () => {
  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('quizzes');
  
  // Dialog states
  const [isQuizDialogOpen, setIsQuizDialogOpen] = useState(false);
  const [isQuestionDialogOpen, setIsQuestionDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  // Form states
  const [quizForm, setQuizForm] = useState({
    title: '',
    description: '',
    time_limit: 30,
    difficulty: 'medium' as const
  });

  const [questionForm, setQuestionForm] = useState({
    question_text: '',
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    correct_answer: '',
    points: 1
  });

  const [assignForm, setAssignForm] = useState({
    class_id: '',
    due_date: ''
  });

  useEffect(() => {
    if (user) {
      fetchQuizzes();
      fetchClasses();
    }
  }, [user]);
  const fetchQuizzes = async () => {
    try {
      const { data, error } = await supabase
        .from('quizzes')
        .select(`
          *,
          questions (*),
          class_quizzes (
            *,
            classes (name)
          )
        `)
        .eq('created_by', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setQuizzes(data || []);
    } catch (error) {
      console.error('Error fetching quizzes:', error);
      toast.error('Failed to fetch quizzes');
    } finally {
      setLoading(false);
    }
  };
  const fetchClasses = async () => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('id, name')
        .eq('teacher_id', user?.id);

      if (error) throw error;
      setClasses(data || []);
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const fetchQuestions = async (quizId: string) => {
    try {
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('quiz_id', quizId)
        .order('order_index');

      if (error) throw error;
      setQuestions(data || []);
    } catch (error) {
      console.error('Error fetching questions:', error);
    }
  };
  const handleCreateQuiz = async () => {
    if (!quizForm.title.trim()) {
      toast.error('Please enter a quiz title');
      return;
    }

    try {
      const { error } = await supabase
        .from('quizzes')
        .insert({
          title: quizForm.title,
          description: quizForm.description,
          time_limit: quizForm.time_limit,
          difficulty: quizForm.difficulty,
          created_by: user?.id
        });

      if (error) throw error;

      toast.success('Quiz created successfully');
      setIsQuizDialogOpen(false);
      resetQuizForm();
      fetchQuizzes();
    } catch (error: any) {
      console.error('Error creating quiz:', error);
      toast.error(error.message || 'Failed to create quiz');
    }
  };
  const handleUpdateQuiz = async () => {
    if (!selectedQuiz || !quizForm.title.trim()) return;

    try {
      const { error } = await supabase
        .from('quizzes')
        .update({
          title: quizForm.title,
          description: quizForm.description,
          time_limit: quizForm.time_limit,
          difficulty: quizForm.difficulty
        })
        .eq('id', selectedQuiz.id);

      if (error) throw error;

      toast.success('Quiz updated successfully');
      setIsQuizDialogOpen(false);
      setSelectedQuiz(null);
      resetQuizForm();
      fetchQuizzes();
    } catch (error: any) {
      console.error('Error updating quiz:', error);
      toast.error(error.message || 'Failed to update quiz');
    }
  };

  const handleDeleteQuiz = async (quizId: string) => {
    if (!confirm('Are you sure you want to delete this quiz? This will also delete all questions and assignments.')) return;

    try {
      const { error } = await supabase
        .from('quizzes')
        .delete()
        .eq('id', quizId);

      if (error) throw error;

      toast.success('Quiz deleted successfully');
      fetchQuizzes();
    } catch (error: any) {
      console.error('Error deleting quiz:', error);
      toast.error(error.message || 'Failed to delete quiz');
    }
  };
  const handleToggleQuizStatus = async (quiz: Quiz) => {
    // Since there's no is_active field, we'll use this to delete/restore quizzes
    // For now, we'll just show a message that this feature isn't available
    toast.info('Quiz status toggle not available with current schema');
  };
  const handleAddQuestion = async () => {
    if (!selectedQuiz || !questionForm.question_text.trim()) {
      toast.error('Please fill in the question text');
      return;
    }

    try {
      const { error } = await supabase
        .from('questions')
        .insert({
          quiz_id: selectedQuiz.id,
          question_text: questionForm.question_text,
          option_a: questionForm.option_a,
          option_b: questionForm.option_b,
          option_c: questionForm.option_c,
          option_d: questionForm.option_d,
          correct_answer: questionForm.correct_answer,
          points: questionForm.points,
          order_index: questions.length
        });

      if (error) throw error;

      toast.success('Question added successfully');
      setIsQuestionDialogOpen(false);
      resetQuestionForm();
      fetchQuestions(selectedQuiz.id);
    } catch (error: any) {
      console.error('Error adding question:', error);
      toast.error(error.message || 'Failed to add question');
    }
  };
  const handleUpdateQuestion = async () => {
    if (!editingQuestion || !questionForm.question_text.trim()) return;

    try {
      const { error } = await supabase
        .from('questions')
        .update({
          question_text: questionForm.question_text,
          option_a: questionForm.option_a,
          option_b: questionForm.option_b,
          option_c: questionForm.option_c,
          option_d: questionForm.option_d,
          correct_answer: questionForm.correct_answer,
          points: questionForm.points
        })
        .eq('id', editingQuestion.id);

      if (error) throw error;

      toast.success('Question updated successfully');
      setIsQuestionDialogOpen(false);
      setEditingQuestion(null);
      resetQuestionForm();
      if (selectedQuiz) fetchQuestions(selectedQuiz.id);
    } catch (error: any) {
      console.error('Error updating question:', error);
      toast.error(error.message || 'Failed to update question');
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm('Are you sure you want to delete this question?')) return;

    try {
      const { error } = await supabase
        .from('questions')
        .delete()
        .eq('id', questionId);

      if (error) throw error;

      toast.success('Question deleted successfully');
      if (selectedQuiz) fetchQuestions(selectedQuiz.id);
    } catch (error: any) {
      console.error('Error deleting question:', error);
      toast.error(error.message || 'Failed to delete question');
    }
  };

  const handleAssignQuiz = async () => {
    if (!selectedQuiz || !assignForm.class_id || !assignForm.due_date) {
      toast.error('Please fill in all assignment details');
      return;
    }

    try {
      const { error } = await supabase
        .from('class_quizzes')
        .insert({
          class_id: assignForm.class_id,
          quiz_id: selectedQuiz.id,
          due_date: assignForm.due_date
        });

      if (error) throw error;

      toast.success('Quiz assigned successfully');
      setIsAssignDialogOpen(false);
      resetAssignForm();
      fetchQuizzes();
    } catch (error: any) {
      console.error('Error assigning quiz:', error);
      toast.error(error.message || 'Failed to assign quiz');
    }
  };
  const handleToggleAssignmentLock = async (assignmentId: string) => {
    // Since there's no is_locked field, we'll show a message
    toast.info('Assignment lock toggle not available with current schema');
  };
  const resetQuizForm = () => {
    setQuizForm({ title: '', description: '', time_limit: 30, difficulty: 'medium' });
  };

  const resetQuestionForm = () => {
    setQuestionForm({
      question_text: '',
      option_a: '',
      option_b: '',
      option_c: '',
      option_d: '',
      correct_answer: '',
      points: 1
    });
  };

  const resetAssignForm = () => {
    setAssignForm({ class_id: '', due_date: '' });
  };  const openEditQuizDialog = (quiz: Quiz) => {
    setSelectedQuiz(quiz);
    setQuizForm({
      title: quiz.title,
      description: quiz.description || '',
      time_limit: quiz.time_limit || 30,
      difficulty: (quiz.difficulty || 'medium') as 'easy' | 'medium' | 'hard'
    });
    setIsQuizDialogOpen(true);
  };

  const openEditQuestionDialog = (question: Question) => {
    setEditingQuestion(question);
    setQuestionForm({
      question_text: question.question_text,
      option_a: question.option_a,
      option_b: question.option_b,
      option_c: question.option_c,
      option_d: question.option_d,
      correct_answer: question.correct_answer,
      points: question.points || 1
    });
    setIsQuestionDialogOpen(true);
  };

  const openQuestionsView = (quiz: Quiz) => {
    setSelectedQuiz(quiz);
    fetchQuestions(quiz.id);
    setActiveTab('questions');
  };

  const openAssignDialog = (quiz: Quiz) => {
    setSelectedQuiz(quiz);
    setIsAssignDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold dark:text-white">Quiz Management</h2>
          <p className="text-gray-600 dark:text-gray-400">Create, edit, and manage quizzes for your classes</p>
        </div>
        <Button onClick={() => setIsQuizDialogOpen(true)} className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          Create Quiz
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="quizzes">My Quizzes</TabsTrigger>
          <TabsTrigger value="questions" disabled={!selectedQuiz}>
            Questions {selectedQuiz ? `(${selectedQuiz.title})` : ''}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="quizzes">
          <Card>
            <CardHeader>
              <CardTitle>Quizzes List</CardTitle>
              <CardDescription>{quizzes.length} quiz{quizzes.length !== 1 ? 'es' : ''} created</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead className="hidden md:table-cell">Duration</TableHead>
                      <TableHead className="hidden lg:table-cell">Questions</TableHead>
                      <TableHead>Difficulty</TableHead>
                      <TableHead className="hidden lg:table-cell">Assignments</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {quizzes.map((quiz) => (
                      <TableRow key={quiz.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{quiz.title}</p>
                            <p className="text-sm text-gray-500 hidden sm:block">{quiz.description}</p>
                          </div>
                        </TableCell>                        <TableCell className="hidden md:table-cell">
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4 text-gray-400" />
                            {quiz.time_limit || 30}m
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <div className="flex items-center gap-1">
                            <BookOpen className="w-4 h-4 text-gray-400" />
                            {quiz.questions?.length || 0}
                          </div>
                        </TableCell>                        <TableCell>
                          <Badge variant="default">
                            {quiz.difficulty || 'medium'}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4 text-gray-400" />
                            {quiz.class_quizzes?.length || 0}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openQuestionsView(quiz)}
                              title="View Questions"
                            >
                              <Eye className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEditQuizDialog(quiz)}
                              title="Edit Quiz"
                            >
                              <Edit className="w-3 h-3" />
                            </Button>                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleToggleQuizStatus(quiz)}
                              title="Toggle Status"
                              disabled
                            >
                              <Eye className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openAssignDialog(quiz)}
                              title="Assign to Class"
                            >
                              <Users className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteQuiz(quiz.id)}
                              className="text-red-600 hover:text-red-700"
                              title="Delete Quiz"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="questions">
          {selectedQuiz && (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>Questions for "{selectedQuiz.title}"</CardTitle>
                    <CardDescription>{questions.length} question{questions.length !== 1 ? 's' : ''} added</CardDescription>
                  </div>
                  <Button onClick={() => setIsQuestionDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Question
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {questions.map((question, index) => (
                    <Card key={question.id} className="border-l-4 border-l-blue-500">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline">Q{index + 1}</Badge>
                              <Badge variant="secondary">Multiple Choice</Badge>
                              <Badge variant="outline">{question.points || 1} point{(question.points || 1) !== 1 ? 's' : ''}</Badge>
                            </div>
                            <p className="font-medium mb-2">{question.question_text}</p>
                            <div className="space-y-1">
                              {[
                                { key: 'A', value: question.option_a },
                                { key: 'B', value: question.option_b },
                                { key: 'C', value: question.option_c },
                                { key: 'D', value: question.option_d }
                              ].map((option) => (
                                <div key={option.key} className="flex items-center gap-2">
                                  <span className="text-sm w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                                    {option.key}
                                  </span>
                                  <span className={`text-sm ${option.value === question.correct_answer ? 'font-medium text-green-600' : ''}`}>
                                    {option.value}
                                  </span>
                                  {option.value === question.correct_answer && (
                                    <Badge variant="default" className="bg-green-500 text-xs">Correct</Badge>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEditQuestionDialog(question)}
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteQuestion(question.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {questions.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No questions added yet. Click "Add Question" to get started.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Quiz Creation/Edit Dialog */}
      <Dialog open={isQuizDialogOpen} onOpenChange={setIsQuizDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedQuiz ? 'Edit Quiz' : 'Create New Quiz'}</DialogTitle>
            <DialogDescription>
              {selectedQuiz ? 'Update quiz information' : 'Create a new quiz for your students'}
            </DialogDescription>
          </DialogHeader>          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Quiz Title *</Label>
              <Input
                id="title"
                value={quizForm.title}
                onChange={(e) => setQuizForm(prev => ({...prev, title: e.target.value}))}
                placeholder="Enter quiz title"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={quizForm.description}
                onChange={(e) => setQuizForm(prev => ({...prev, description: e.target.value}))}
                placeholder="Enter quiz description"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="time_limit">Time Limit (minutes)</Label>
                <Input
                  id="time_limit"
                  type="number"
                  min="1"
                  max="180"
                  value={quizForm.time_limit}
                  onChange={(e) => setQuizForm(prev => ({...prev, time_limit: parseInt(e.target.value) || 30}))}
                />
              </div>
              <div>
                <Label htmlFor="difficulty">Difficulty</Label>
                <Select 
                  value={quizForm.difficulty} 
                  onValueChange={(value: any) => setQuizForm(prev => ({...prev, difficulty: value}))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsQuizDialogOpen(false);
              setSelectedQuiz(null);
              resetQuizForm();
            }}>
              Cancel
            </Button>
            <Button onClick={selectedQuiz ? handleUpdateQuiz : handleCreateQuiz}>
              {selectedQuiz ? 'Update Quiz' : 'Create Quiz'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Question Creation/Edit Dialog */}
      <Dialog open={isQuestionDialogOpen} onOpenChange={setIsQuestionDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingQuestion ? 'Edit Question' : 'Add New Question'}</DialogTitle>
            <DialogDescription>
              {editingQuestion ? 'Update question details' : 'Create a new question for this quiz'}
            </DialogDescription>
          </DialogHeader>          <div className="space-y-4">
            <div>
              <Label htmlFor="question-text">Question Text *</Label>
              <Textarea
                id="question-text"
                value={questionForm.question_text}
                onChange={(e) => setQuestionForm(prev => ({...prev, question_text: e.target.value}))}
                placeholder="Enter your question"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="points">Points</Label>
              <Input
                id="points"
                type="number"
                min="1"
                max="100"
                value={questionForm.points}
                onChange={(e) => setQuestionForm(prev => ({...prev, points: parseInt(e.target.value) || 1}))}
              />
            </div>

            <div className="space-y-3">
              <Label>Answer Options</Label>
              {[
                { key: 'option_a', label: 'A' },
                { key: 'option_b', label: 'B' },
                { key: 'option_c', label: 'C' },
                { key: 'option_d', label: 'D' }
              ].map((option) => (
                <div key={option.key} className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-sm">
                    {option.label}
                  </span>
                  <Input
                    value={(questionForm as any)[option.key]}
                    onChange={(e) => {
                      setQuestionForm(prev => ({...prev, [option.key]: e.target.value}));
                    }}
                    placeholder={`Option ${option.label}`}
                  />
                </div>
              ))}
              <div>
                <Label htmlFor="correct-answer">Correct Answer</Label>
                <Select 
                  value={questionForm.correct_answer} 
                  onValueChange={(value) => setQuestionForm(prev => ({...prev, correct_answer: value}))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select correct answer" />
                  </SelectTrigger>
                  <SelectContent>
                    {[
                      { key: 'option_a', label: 'A', value: questionForm.option_a },
                      { key: 'option_b', label: 'B', value: questionForm.option_b },
                      { key: 'option_c', label: 'C', value: questionForm.option_c },
                      { key: 'option_d', label: 'D', value: questionForm.option_d }
                    ].map((option) => (
                      option.value.trim() && (
                        <SelectItem key={option.key} value={option.value}>
                          {option.label}: {option.value}
                        </SelectItem>
                      )
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsQuestionDialogOpen(false);
              setEditingQuestion(null);
              resetQuestionForm();
            }}>
              Cancel
            </Button>
            <Button onClick={editingQuestion ? handleUpdateQuestion : handleAddQuestion}>
              {editingQuestion ? 'Update Question' : 'Add Question'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Quiz Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Quiz to Class</DialogTitle>
            <DialogDescription>
              Assign "{selectedQuiz?.title}" to a class with a due date
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="assign-class">Select Class *</Label>
              <Select value={assignForm.class_id} onValueChange={(value) => setAssignForm(prev => ({...prev, class_id: value}))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="due-date">Due Date *</Label>
              <Input
                id="due-date"
                type="datetime-local"
                value={assignForm.due_date}
                onChange={(e) => setAssignForm(prev => ({...prev, due_date: e.target.value}))}
              />
            </div>            {selectedQuiz?.class_quizzes && selectedQuiz.class_quizzes.length > 0 && (
              <div>
                <Label>Current Assignments</Label>
                <div className="space-y-2 max-h-32 overflow-y-auto border rounded p-2">
                  {selectedQuiz.class_quizzes.map((assignment) => (
                    <div key={assignment.id} className="flex items-center justify-between text-sm">
                      <span>{assignment.classes?.name}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="default">Assigned</Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleToggleAssignmentLock(assignment.id)}
                          disabled
                        >
                          <Lock className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsAssignDialogOpen(false);
              setSelectedQuiz(null);
              resetAssignForm();
            }}>
              Cancel
            </Button>
            <Button onClick={handleAssignQuiz}>Assign Quiz</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
