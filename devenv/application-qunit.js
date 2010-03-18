module("init tests");

test("Start up", function(){
	equals(typeof Application.init,"function","should have an init function");
	ok(true,"true should definitely be trueish");
});


module("Overall test");

test("Test application", function(){
	var p = new Project("TestProject", "2010-03-18 10:27");
	ok(p instanceof Project, "Should be Project");
	
	var b1Status = new Status("Critical", "#FF0000");
	ok(b1Status instanceof Status, "Should be Status");
	
	var b1 = new Bug("0001", "First bug of TestProject", "2010-03-18 10:30", b1Status);
	ok(b1 instanceof Bug, "Should be Bug");
	ok(b1.bugStatus instanceof Status, "Should be status");
	
	var c1 = new Comment("First comment", "2010-03-18 10:30");
	ok(c1 instanceof Comment, "Should be Comment");
	
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
	var p = new Project("TestProject", "2010-03-18 09:32");
	ok(p instanceof Project, "Should be true");
});

test("Add bugs to project", function(){
	var p = new Project("TestProject", "2010-03-18 09:32");
	
	var b1Status = new Status("Critical", "#FF0000");
	var b1 = new Bug("0001", "First bug of TestProject", "2010-03-18 09:37", b1Status);
	p.add(b1);
	
	var b2Status = new Status("Solved", "#49E20E");
	var b2 = new Bug("0002", "Second bug of TestProject", "2010-03-18 09:42", b2Status);
	p.add(b2);
	
	equals(p.bugs.length, 2, "Should be 2");
});

test("Remove bugs from project", function(){
	var p = new Project("TestProject", "2010-03-18 09:32");
	
	var b1Status = new Status("Critical", "#FF0000");
	var b1 = new Bug("0001", "First bug of TestProject", "2010-03-18 09:37", b1Status);
	p.add(b1);
	
	var b2Status = new Status("Solved", "#49E20E");
	var b2 = new Bug("0002", "Second bug of TestProject", "2010-03-18 09:42", b2Status);
	p.add(b2);
	
	equals(p.bugs.length, 2, "Should be 2");
	
	p.remove(1);
	
	equals(p.bugs.length, 1, "Should be 1");
});


module("Bug tests");

test("Create bug", function(){
	var bStatus = new Status("Critical", "#FF0000");
	var b = new Bug("0001", "First bug of test", "2010-03-18 10:02", bStatus);
	ok(b instanceof Bug, "Should be true");
});

test("Add comments to bug", function(){
	var bStatus = new Status("Critical", "#FF0000");
	var b = new Bug("0001", "First bug of test", "2010-03-18 10:02", bStatus);
	
	var c1 = new Comment("First comment", "2010-03-18 10:10");
	b.add(c1);
	
	var c2 = new Comment("Second comment", "2010-03-18 10:10");
	b.add(c2);
	
	equals(b.comments.length, 2, "Should be 2");
});

test("Remove comments from bug", function(){
	var bStatus = new Status("Critical", "#FF0000");
	var b = new Bug("0001", "First bug of test", "2010-03-18 10:02", bStatus);
	
	var c1 = new Comment("First comment", "2010-03-18 10:10");
	b.add(c1);
	
	var c2 = new Comment("Second comment", "2010-03-18 10:10");
	b.add(c2);
	
	equals(b.comments.length, 2, "Should be 2");
	
	b.remove(1);
	
	equals(b.comments.length, 1, "Should be 1");
});

module("Status tests");

test("Create status", function(){
	var s = new Status("Critical", "#FF0000");
	ok(s instanceof Status, "Should be true");
});

module("Comment tests");

test("Create comment", function(){
	var c = new Comment("First comment", "2010-03-18 10:10");
	ok(c instanceof Comment, "Should be true");
});