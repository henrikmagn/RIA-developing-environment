module("init tests");

test("Start up", function(){
	equals(typeof BugTrackr.init,"function","should have an init function");
	ok(true,"true should definitely be trueish");
});


module("Overall test");

test("Test application", function(){
	var p = new BugTrackr.Project("TestProject", "2010-03-18 10:27");

	var b1Status = new BugTrackr.Status("Critical", "#FF0000");
	var b1 = new BugTrackr.Bug("0001", "First bug of TestProject", "2010-03-18 10:30", b1Status);	
	var c1 = new BugTrackr.Comment("First comment", "2010-03-18 10:30");
	
	p.add(b1);	
	equals(p.bugs.length, 1, "Should be 1 bug");
	
	b1.add(c1);
	equals(b1.comments.length, 1, "Should be 1 comment");
	
	b1.remove(0);
	equals(b1.comments.length, 0, "Should be 0 comments");
	
	p.remove(0);
	equals(p.bugs.length, 0, "Should be 0 bugs");
});

module("Project tests");

test("Create project", function(){
	var p = new BugTrackr.Project("TestProject", "2010-03-18 09:32");
});

test("Add bugs to project", function(){
	var p = new BugTrackr.Project("TestProject", "2010-03-18 09:32");
	
	var b1Status = new BugTrackr.Status("Critical", "#FF0000");
	var b1 = new BugTrackr.Bug("0001", "First bug of TestProject", "2010-03-18 09:37", b1Status);
	p.add(b1);
	
	var b2Status = new BugTrackr.Status("Solved", "#49E20E");
	var b2 = new BugTrackr.Bug("0002", "Second bug of TestProject", "2010-03-18 09:42", b2Status);
	p.add(b2);
	
	equals(p.bugs.length, 2, "Should be 2");
});

test("Remove bugs from project", function(){
	var p = new BugTrackr.Project("TestProject", "2010-03-18 09:32");
	
	var b1Status = new BugTrackr.Status("Critical", "#FF0000");
	var b1 = new BugTrackr.Bug("0001", "First bug of TestProject", "2010-03-18 09:37", b1Status);
	p.add(b1);
	
	var b2Status = new BugTrackr.Status("Solved", "#49E20E");
	var b2 = new BugTrackr.Bug("0002", "Second bug of TestProject", "2010-03-18 09:42", b2Status);
	p.add(b2);
	
	equals(p.bugs.length, 2, "Should be 2");
	
	p.remove(1);
	
	equals(p.bugs.length, 1, "Should be 1");
});


module("Bug tests");

test("Create bug", function(){
	var bStatus = new BugTrackr.Status("Critical", "#FF0000");
	var b = new BugTrackr.Bug("0001", "First bug of test", "2010-03-18 10:02", bStatus);
});

test("Add comments to bug", function(){
	var bStatus = new BugTrackr.Status("Critical", "#FF0000");
	var b = new BugTrackr.Bug("0001", "First bug of test", "2010-03-18 10:02", bStatus);
	
	var c1 = new BugTrackr.Comment("First comment", "2010-03-18 10:10");
	b.add(c1);
	
	var c2 = new BugTrackr.Comment("Second comment", "2010-03-18 10:10");
	b.add(c2);
	
	equals(b.comments.length, 2, "Should be 2");
});

test("Remove comments from bug", function(){
	var bStatus = new BugTrackr.Status("Critical", "#FF0000");
	var b = new BugTrackr.Bug("0001", "First bug of test", "2010-03-18 10:02", bStatus);
	
	var c1 = new BugTrackr.Comment("First comment", "2010-03-18 10:10");
	b.add(c1);
	
	var c2 = new BugTrackr.Comment("Second comment", "2010-03-18 10:10");
	b.add(c2);
	
	equals(b.comments.length, 2, "Should be 2");
	
	b.remove(1);
	
	equals(b.comments.length, 1, "Should be 1");
});

module("Status tests");

test("Create status", function(){
	var s = new BugTrackr.Status("Critical", "#FF0000");
});

module("Comment tests");

test("Create comment", function(){
	var c = new BugTrackr.Comment("First comment", "2010-03-18 10:10");
});