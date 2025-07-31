import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Users, Receipt, PieChart, ArrowRight, Sparkles } from "lucide-react";

const Welcome = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();

  const features = [
    {
      icon: <Users className="h-8 w-8 text-primary" />,
      title: "Create Groups",
      description: "Organize expenses with friends, family, or roommates",
      benefit: "Keep everyone on the same page"
    },
    {
      icon: <Receipt className="h-8 w-8 text-primary" />,
      title: "Track Expenses",
      description: "Add bills, groceries, and shared costs easily",
      benefit: "Never forget who paid for what"
    },
    {
      icon: <PieChart className="h-8 w-8 text-primary" />,
      title: "Smart Settlements",
      description: "Automatically calculate who owes what to whom",
      benefit: "Minimize the number of transactions"
    }
  ];

  const steps = [
    "Welcome to SplitWise Pay! Let's get you started.",
    "Create your first group with friends or family.",
    "Add your first shared expense.",
    "Watch the magic happen as we calculate everything!"
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      navigate("/");
    }
  };

  const handleSkip = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5 p-4">
      <div className="max-w-4xl mx-auto pt-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-24 h-24 mx-auto bg-gradient-primary rounded-full flex items-center justify-center mb-6">
            <Sparkles className="h-12 w-12 text-primary-foreground" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-4">
            Welcome to SplitWise Pay
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            The smartest way to split expenses and settle debts with your groups
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center mb-12">
          <div className="flex items-center space-x-4">
            {steps.map((_, index) => (
              <div key={index} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  index <= currentStep 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {index < currentStep ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    index + 1
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-12 h-0.5 mx-2 ${
                    index < currentStep ? 'bg-primary' : 'bg-muted'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Current Step Content */}
        <Card className="tech-border shadow-card mb-8">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{steps[currentStep]}</CardTitle>
          </CardHeader>
          <CardContent>
            {currentStep === 0 && (
              <div className="text-center space-y-6">
                <p className="text-lg text-muted-foreground">
                  You're about to experience the easiest way to manage shared expenses.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {features.map((feature, index) => (
                    <div key={index} className="space-y-4 p-4 rounded-lg border bg-card">
                      <div className="flex justify-center">{feature.icon}</div>
                      <h3 className="font-semibold text-center">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground text-center">
                        {feature.description}
                      </p>
                      <Badge variant="secondary" className="w-full justify-center">
                        {feature.benefit}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {currentStep === 1 && (
              <div className="text-center space-y-6">
                <Users className="h-16 w-16 text-primary mx-auto" />
                <p className="text-lg text-muted-foreground">
                  Groups help you organize expenses by category - roommates, vacation, dinner party, etc.
                </p>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm">
                    💡 <strong>Pro tip:</strong> You can invite members via email or share an invite link!
                  </p>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="text-center space-y-6">
                <Receipt className="h-16 w-16 text-primary mx-auto" />
                <p className="text-lg text-muted-foreground">
                  Add any shared expense - groceries, dinner, utilities, or vacation costs.
                </p>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm">
                    💡 <strong>Pro tip:</strong> Expenses can be split equally or you can customize who pays what!
                  </p>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="text-center space-y-6">
                <PieChart className="h-16 w-16 text-primary mx-auto" />
                <p className="text-lg text-muted-foreground">
                  Our smart algorithm calculates the optimal way to settle all debts with minimum transactions.
                </p>
                <div className="bg-gradient-primary/10 p-4 rounded-lg border border-primary/20">
                  <p className="text-sm">
                    🎉 <strong>You're all set!</strong> Start creating groups and adding expenses to see the magic in action.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-between items-center">
          <Button variant="ghost" onClick={handleSkip}>
            Skip Tutorial
          </Button>
          <Button onClick={handleNext} className="gap-2">
            {currentStep === steps.length - 1 ? "Get Started" : "Next"}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Welcome;