import { db } from "../libs/db.js"
import {getJudge0LanguageId,submitBatch,pollBatchResults} from  "../libs/judge0.lib.js"



export const createProblem = async (req, res) => {
    // console.log("create controller...!")
    // going to get the all the dara from te request body
    const { title,
        description,
        difficulty,
        tags,
        examples,
        constraints,
        testcases,
        codeSnippet,
        referenceSolution
    } = req.body;

    if (req.user.role != "ADMIN") {
        return res.status(403).json({
            error: "You are not allowed to create a problem"
        })
    }
        
    // console.log("Role admin...!")
        try {
            // console.log("try catch...!")
            for (const [language, solutionCode] of Object.entries(referenceSolution)) {
                // console.log("Before");
                const languageId = getJudge0LanguageId(language);
                console.log(languageId);
                if (!languageId) {
                    return res.status(400).json({
                        error: "Languge ${language} is not supported"
                    })
                }
                const submissions = testcases.map(({ input, output }) => ({
                    source_code: solutionCode,
                    language_id: languageId,
                    stdin: input,
                    expected_output: output,
                }))
                // console.log(submissions)
                // console.log("Entry in the Joudge")
                // const sumbissionResults = await submitBatch(submissions)

                const submissionResults = await submitBatch(submissions);

                // console.log(submissionResults)

                // const tokens = sumbissionResults.map((res) => res.token);
                const tokens = submissionResults.map((res) => res.token);


                // console.log(tokens)

                // const results = await pollBatchResults(tokens);
                const results = await pollBatchResults(tokens);

                // console.log(results)

                for (let i = 0; i < results; i++) {
                    const result = results[i];
                    // console.log("Result----", result);

                    if (result.status.id !== 3) {
                        return res.status(400).json({ error: `Testcase ${i + 1} failed for language ${language}` })
                    }
                }
                // save the problem in the database


                const newProblem = await db.problem.create({
                    data: {
                        title,
                        description,
                        difficulty,
                        tags,
                        examples,
                        constraints,
                        testcases,
                        codeSnippet,
                        referenceSolution,
                        userId: req.user.id,
                    }
                })
                return res.status(201).json(newProblem);
            }
        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error:"Internal server error"
            })
        }
    }
    // going to check the uer role once again
    //leep thorugh each refernece solution for different languge (python,javascript,java)
// }

export const getAllProblems = async (req, res, next) => {
    try {
        const problems = await db.problem.findMany();

        if(!problems){
            return res.status(404).json({
                error:"No problems Found"
            })
        }
        res.status(200).json({
            success:true,
            message:"Message Fetched Successfully",
            problems
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            error:"Error while Fetching Problems",
        });
        
    }
}

export const getProblemById = async (req, res, next) => {
    const {id} = req.params;
try {
    const problem = await db.problem.findUnique(
        {
            where:{
                id
            }
        }
    )
    if(!problem){
        return res.status(404).json({
            error:"Problem not found."
        })
    }

    return res.status(200).json({
        success:true,
        message:"Message Created Successfully",
        problem
    })
} catch (error) {
    console.log(error);
    return res.status(500).json({
        error:"Error while Fetching Problem by id",
    });
}
}

export const updateProblem = async (req, res, next) => {

    //get the problemID
    // console.log("enter the problem update controller")
    const  problemId = req.params.id;
    // get the all filed in body
    const { title,
        description,
        difficulty,
        tags,
        examples,
        constraints,
        testcases,
        codeSnippet,
        referenceSolution
    } = req.body;

    console.log(problemId);

    //Check the role 
    if(req.user.role !== 'ADMIN'){
        return res.status(403).json({
            error:"You are not allowed to update a problem"
        })
    }

    try {

        //Problem is exist or not
      
            const existingProblem =await db.problem.findUnique({
                where:{
                    id:problemId
                },
            });
            console.log("problem is exist");
            if(!existingProblem){
                return res.status(404).json({
                    error:"Problem not found"
                });
            }

        // console.log("try catch...!")
        for (const [language, solutionCode] of Object.entries(referenceSolution)) {
            // console.log("Before");
            const languageId = getJudge0LanguageId(language);
            console.log(languageId);
            if (!languageId) {
                return res.status(400).json({
                    error: "Languge ${language} is not supported"
                })
            }
            const submissions = testcases.map(({ input, output }) => ({
                source_code: solutionCode,
                language_id: languageId,
                stdin: input,
                expected_output: output,
            }))
          
            const submissionResults = await submitBatch(submissions);

          
            const tokens = submissionResults.map((res) => res.token);


         
            const results = await pollBatchResults(tokens);

          
            for (let i = 0; i < results; i++) {
                const result = results[i];
                // console.log("Result----", result);

                if (result.status.id !== 3) {
                    return res.status(400).json({ error: `Testcase ${i + 1} failed for language ${language}` })
                }
            }
            // save the problem in the database


            const updatedProblem = await db.problem.update({
                where:{
                    id:problemId
                },
                data: {
                    title,
                    description,
                    difficulty,
                    tags,
                    examples,
                    constraints,
                    testcases,
                    codeSnippet,
                    referenceSolution,
                    userId: req.user.id,
                }
            })
            return res.status(201).json(updatedProblem);
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            error:"Internal server error"
        });
    }

}

export const deleteProblem = async (req, res, next) => {

    const problemId = req.params.id;

   try {
    const problem =await db.problem.findUnique({
        where:{
            id:problemId
        },
    });

    if(!problem){
        return res.status(404).json({
            error:"Problem not found"
        });
    }

    await db.problem.delete({where:{
        id:problemId
    }});

    res.status(200).json({
        success:true,
        message:"Problem deleted Successfully"
    })
   } catch (error) {
    console.log(error);
    res.status(500).json({
        error:"Error while deleting the Problem"
    });
   }
}

export const getAllProblemsSolvedByUser = async (re, qres, next) => {

}